type WatchHistory = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
};

type RatingResult = {
  ratings: Record<string, number>;
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
  const GAMMA = 0.5;   // Transitive discount factor

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

  // Compute transitive relationships using discounted graph traversal
  const computeTransitiveComparisons = () => {
    const transitiveGraph: Record<string, Map<string, number>> = {};

    for (const title in graph) {
      transitiveGraph[title] = new Map(graph[title]);
    }

    for (const b in graph) {
      for (const a in graph) {
        if (a === b) continue;

        const aToB = transitiveGraph[a].get(b) || 0;
        if (aToB > 0) {
          for (const [c, bToC] of graph[b].entries()) {
            if (a === c || b === c) continue;

            const inferredCount = Math.min(aToB, bToC) * GAMMA;
            if (inferredCount > 0) {
              const current = transitiveGraph[a].get(c) || 0;
              transitiveGraph[a].set(c, current + inferredCount);

              addMatch(a, c, inferredCount);
              addMatch(c, a, inferredCount);
              wins[a] += inferredCount;
            }
          }
        }
      }
    }

    return transitiveGraph;
  };

  // Apply transitive comparisons
  computeTransitiveComparisons();

  const items = Object.keys(wins);

  const totalComparisons =
    Object.values(matches).reduce(
      (sum, matchObj) =>
        sum + Object.values(matchObj).reduce((s, v) => s + v, 0),
      0
    ) / 2;

  let ratings: Record<string, number>;

  if (totalComparisons === 0) {
    const equalRating = 1 / items.length;
    ratings = items.reduce((acc, item) => {
      acc[item] = equalRating;
      return acc;
    }, {} as Record<string, number>);
  } else {
    ratings = {};
    items.forEach((item) => {
      const totalMatches = Object.values(matches[item] || {}).reduce(
        (sum, count) => sum + count,
        0
      );
      ratings[item] = totalMatches > 0 ? wins[item] / totalMatches : 0.5;
    });

    const prior = 0.5;
    const priorStrength = 2;

    const initialTotal = Object.values(ratings).reduce(
      (sum, val) => sum + val,
      0
    );
    for (const key in ratings) {
      ratings[key] /= initialTotal;
      if (ratings[key] < 1e-10) ratings[key] = 1e-10;
    }

    const maxIterations = 1000;
    const convergenceThreshold = 1e-6;
    const damping = 0.5;

    let lastDiff = Infinity;
    let nonImprovementCount = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newRatings: Record<string, number> = {};

      for (const i of items) {
        const numerator = wins[i] + prior * priorStrength;
        let denominator = 0;

        if (matches[i]) {
          for (const j in matches[i]) {
            const n_ij = matches[i][j];
            denominator += (n_ij * ratings[j]) / (ratings[i] + ratings[j]);
          }
        }

        denominator += priorStrength;

        const updatedValue = numerator / denominator;
        newRatings[i] = (1 - damping) * ratings[i] + damping * updatedValue;
      }

      const total = Object.values(newRatings).reduce(
        (sum, val) => sum + val,
        0
      );
      for (const key in newRatings) {
        newRatings[key] /= total;
      }

      let diff = 0;
      for (const i of items) {
        diff += Math.abs(newRatings[i] - ratings[i]);
      }

      if (diff >= lastDiff) {
        nonImprovementCount++;
        if (nonImprovementCount >= 5) {
          break;
        }
      } else {
        nonImprovementCount = 0;
      }

      lastDiff = diff;
      Object.assign(ratings, newRatings);

      if (diff < convergenceThreshold) {
        break;
      }
    }
  }

  // Compute uncertainties using the diagonal Laplace approximation
  const uncertainties: Record<string, number> = {};
  const priorVariance = 1.0; // Baseline variance in log-odds space

  items.forEach((i) => {
    let H_ii = 1.0 / priorVariance;
    if (matches[i]) {
      for (const j in matches[i]) {
        const n_ij = matches[i][j];
        const r_i = ratings[i] || 0;
        const r_j = ratings[j] || 0;
        const sum = r_i + r_j;
        if (sum > 0) {
          H_ii += n_ij * (r_i * r_j) / Math.pow(sum, 2);
        }
      }
    }
    const sdLogOdds = 1.0 / Math.sqrt(H_ii);
    const ratingVal = ratings[i] || 0;
    // Apply delta method to map standard deviation to probability space:
    // sd_prob = sd_log_odds * pi * (1 - pi)
    uncertainties[i] = sdLogOdds * ratingVal * (1.0 - ratingVal);
  });

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
