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
  /**
   * Preference loops of three or more films: each film beat the next, and
   * the last beat the first. Holds the shortest loop through every comparison
   * that lies on one, starting from its alphabetically first film.
   */
  cycles: string[][];
};

export const calculateRatings = (
  watchHistory: WatchHistory[]
): RatingResult => {
  const sortedHistory = [...watchHistory].sort((a, b) => a.order - b.order);

  const wins: Record<string, number> = {};
  const matches: Record<string, Record<string, number>> = {};

  const addMatch = (a: string, b: string) => {
    if (!matches[a]) matches[a] = {};
    matches[a][b] = (matches[a][b] || 0) + 1;
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

  // Process direct comparisons from the watch history. Every comparison
  // counts once, however long ago it was made: a film's standing changes
  // when it is rewatched and compared again, not as its last watch ages.
  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i - 1];
    const curr = sortedHistory[i];

    if (prev.title === curr.title || curr.betterThanPrevious === null) continue;

    // Record direct match
    addMatch(prev.title, curr.title);
    addMatch(curr.title, prev.title);

    const [winner, loser] = curr.betterThanPrevious
      ? [curr.title, prev.title]
      : [prev.title, curr.title];
    wins[winner] += 1;
    graph[winner].set(loser, (graph[winner].get(loser) || 0) + 1);
  }

  // Detect circular preferences (A > B > C > A, or longer) on the direct graph.
  //
  // A loop of any length is a contradiction, but a graph can hold
  // exponentially many loops, so this reports the shortest loop through each
  // comparison that lies on one. A split record (A beat B, B beat A) is a
  // change of mind rather than a loop, so a loop needs at least three films.
  const detectCycles = (directGraph: Record<string, Map<string, number>>): string[][] => {
    // Sorted, so the loops reported do not depend on the order of the rows.
    const titles = Object.keys(directGraph).sort();
    const beatenBy = new Map(
      titles.map((title) => [title, [...directGraph[title].keys()].sort()])
    );

    const cyclesList: string[][] = [];
    const seen = new Set<string>();

    for (const winner of titles) {
      for (const loser of beatenBy.get(winner)!) {
        // Breadth-first search for the shortest chain of wins leading from
        // `loser` back to `winner`, which closes a loop through this win.
        const cameFrom = new Map<string, string>();
        const visited = new Set([loser]);
        const queue = [loser];
        let chain: string[] | null = null;

        for (let head = 0; head < queue.length && !chain; head++) {
          const current = queue[head];
          for (const next of beatenBy.get(current) ?? []) {
            if (next === winner) {
              // The loser beating the winner straight back is a split record.
              if (current === loser) continue;
              chain = [current];
              while (chain[0] !== loser) chain.unshift(cameFrom.get(chain[0])!);
              break;
            }
            if (!visited.has(next)) {
              visited.add(next);
              cameFrom.set(next, current);
              queue.push(next);
            }
          }
        }
        if (!chain) continue;

        // Start every loop at its alphabetically first film, so the same loop
        // found from a different comparison is recognized as a repeat.
        const cycle = [winner, ...chain];
        const start = cycle.indexOf([...cycle].sort()[0]);
        const rotated = [...cycle.slice(start), ...cycle.slice(0, start)];
        const key = JSON.stringify(rotated);
        if (!seen.has(key)) {
          seen.add(key);
          cyclesList.push(rotated);
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
  // under the fitted strengths equal its actual wins.
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
