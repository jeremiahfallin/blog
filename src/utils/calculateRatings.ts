type WatchHistory = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
};

type RatingResult = {
  /** Each film's share of total Bradley-Terry strength; the shares sum to 1. */
  ratings: Record<string, number>;
  /**
   * Posterior standard deviation of each film's log-strength. A value of σ
   * means the film's true rating plausibly lies within a factor of e^σ
   * either side of its fitted rating.
   */
  uncertainties: Record<string, number>;
  graph: {
    nodes: Array<{ id: string; rating: number; uncertainty: number }>;
    links: Array<{ source: string; target: string; weight: number }>;
  };
  cycles: string[][];
};

export const calculateRatings = (
  watchHistory: WatchHistory[]
): RatingResult => {
  const sortedHistory = [...watchHistory].sort((a, b) => a.order - b.order);

  // Find maximum watch date for temporal decay reference
  const dates = sortedHistory
    .filter((item) => item.dateWatched)
    .map((item) => new Date(item.dateWatched).getTime());
  const maxDate = dates.length > 0 ? Math.max(...dates) : Date.now();

  const LAMBDA = 0.002; // halflife approx 346 days (~1 year)

  const wins: Record<string, number> = {};
  const matches: Record<string, Record<string, number>> = {};

  const addMatch = (a: string, b: string, weight: number = 1) => {
    if (!matches[a]) matches[a] = {};
    matches[a][b] = (matches[a][b] || 0) + weight;
  };

  // Initialize win counts for each title.
  sortedHistory.forEach((item) => {
    if (!(item.title in wins)) {
      wins[item.title] = 0;
    }
  });

  // Build a graph representing "better than" relationships
  const graph: Record<string, Map<string, number>> = {};

  sortedHistory.forEach((item) => {
    if (!graph[item.title]) {
      graph[item.title] = new Map<string, number>();
    }
  });

  // Process direct comparisons from the watch history with temporal decay
  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i - 1];
    const curr = sortedHistory[i];

    if (prev.title === curr.title || curr.betterThanPrevious === null) continue;

    // Calculate time diff in days and apply decay
    const watchTime = new Date(curr.dateWatched).getTime();
    const diffDays = Math.max(0, (maxDate - watchTime) / (1000 * 3600 * 24));
    const decayWeight = Math.exp(-LAMBDA * diffDays);

    // Record direct match
    addMatch(prev.title, curr.title, decayWeight);
    addMatch(curr.title, prev.title, decayWeight);

    if (curr.betterThanPrevious === true) {
      wins[curr.title] += decayWeight;
      const currentEdges = graph[curr.title];
      currentEdges.set(prev.title, (currentEdges.get(prev.title) || 0) + decayWeight);
    } else {
      wins[prev.title] += decayWeight;
      const prevEdges = graph[prev.title];
      prevEdges.set(curr.title, (prevEdges.get(curr.title) || 0) + decayWeight);
    }
  }

  // Detect circular preferences (3-cycles: A > B > C > A) on the direct graph
  const detectCycles = (directGraph: Record<string, Map<string, number>>): string[][] => {
    const cyclesList: string[][] = [];
    const seen = new Set<string>();

    for (const a in directGraph) {
      const edgesA = directGraph[a];
      for (const b of edgesA.keys()) {
        const edgesB = directGraph[b];
        if (!edgesB) continue;
        for (const c of edgesB.keys()) {
          const edgesC = directGraph[c];
          if (!edgesC) continue;
          if (edgesC.has(a)) {
            const cycle = [a, b, c];
            const minElement = [...cycle].sort()[0];
            const minIndex = cycle.indexOf(minElement);
            const shifted = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
            const key = shifted.join(" -> ");
            if (!seen.has(key)) {
              seen.add(key);
              cyclesList.push(cycle);
            }
          }
        }
      }
    }
    return cyclesList;
  };

  const cycles = detectCycles(graph);

  const items = Object.keys(wins);

  // Fit Bradley-Terry strengths, P(i beats j) = s_i / (s_i + s_j), by
  // maximum a posteriori.
  //
  // Prior: besides its real comparisons, every film plays PRIOR_GAMES virtual
  // games against a reference film whose strength is pinned at 1, winning
  // PRIOR_WIN_RATE of them. That pulls thinly compared films toward the
  // reference, fixes the overall scale (strengths are otherwise only defined
  // up to a common factor) and keeps a film with an unbeaten or winless
  // record finite.
  const PRIOR_GAMES = 2;
  const PRIOR_WIN_RATE = 0.5;
  const REFERENCE_STRENGTH = 1;

  const strengths: Record<string, number> = {};
  for (const i of items) strengths[i] = REFERENCE_STRENGTH;

  // Hunter's MM update: s_i ← wins_i / Σ_j n_ij / (s_i + s_j), with the
  // virtual games counted on both sides. Each round increases the posterior,
  // so it needs no damping; at the fixed point every film's expected wins
  // under the fitted strengths equal its actual (decay-weighted) wins.
  const maxIterations = 10000;
  const convergenceThreshold = 1e-12; // largest change in any log-strength

  let converged = false;
  for (let iter = 0; iter < maxIterations && !converged; iter++) {
    const next: Record<string, number> = {};
    let largestLogChange = 0;

    for (const i of items) {
      const numerator = wins[i] + PRIOR_WIN_RATE * PRIOR_GAMES;
      let denominator = PRIOR_GAMES / (strengths[i] + REFERENCE_STRENGTH);
      for (const j in matches[i]) {
        denominator += matches[i][j] / (strengths[i] + strengths[j]);
      }

      next[i] = numerator / denominator;
      largestLogChange = Math.max(
        largestLogChange,
        Math.abs(Math.log(next[i] / strengths[i]))
      );
    }

    Object.assign(strengths, next);
    converged = largestLogChange < convergenceThreshold;
  }

  if (!converged) {
    throw new Error(
      `Bradley-Terry fit did not converge within ${maxIterations} iterations.`
    );
  }

  // Published ratings are each film's share of the total strength.
  const totalStrength = items.reduce((sum, i) => sum + strengths[i], 0);
  const ratings: Record<string, number> = {};
  for (const i of items) ratings[i] = strengths[i] / totalStrength;

  // Uncertainty: the posterior standard deviation of each film's
  // log-strength, from a diagonal Laplace approximation. The curvature of
  // the log-posterior in log(s_i) is Σ_j n_ij · p_ij · (1 − p_ij) over the
  // film's real and virtual games, so it depends on how much evidence the
  // film has and how informative it was — not on how high the film scores.
  const uncertainties: Record<string, number> = {};
  const curvatureOf = (a: number, b: number) => (a * b) / (a + b) ** 2;

  for (const i of items) {
    let curvature =
      PRIOR_GAMES * curvatureOf(strengths[i], REFERENCE_STRENGTH);
    for (const j in matches[i]) {
      curvature += matches[i][j] * curvatureOf(strengths[i], strengths[j]);
    }
    uncertainties[i] = 1 / Math.sqrt(curvature);
  }

  const graphForDisplay = {
    nodes: items.map((title) => ({
      id: title,
      rating: ratings[title] || 0,
      uncertainty: uncertainties[title] || 0,
    })),
    links: [] as Array<{ source: string; target: string; weight: number }>,
  };

  for (const source in graph) {
    for (const [target, weight] of graph[source].entries()) {
      if (weight > 0) {
        graphForDisplay.links.push({
          source,
          target,
          weight,
        });
      }
    }
  }

  return {
    ratings,
    uncertainties,
    graph: graphForDisplay,
    cycles,
  };
};
