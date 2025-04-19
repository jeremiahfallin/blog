type WatchHistory = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
};

// Define a new return type that includes both ratings and graph
type RatingResult = {
  ratings: Record<string, number>;
  graph: {
    nodes: Array<{ id: string; rating: number }>;
    links: Array<{ source: string; target: string; weight: number }>;
  };
};

export const calculateRatings = (
  watchHistory: WatchHistory[]
): RatingResult => {
  // Sort by order to ensure comparisons are between consecutive events.
  const sortedHistory = [...watchHistory].sort((a, b) => a.order - b.order);

  const wins: Record<string, number> = {};
  const matches: Record<string, Record<string, number>> = {};

  // Helper: safely increment a match count between two titles.
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
  // For each movie, store a map of movies it's better than and the comparison count
  const graph: Record<string, Map<string, number>> = {};

  // Initialize the graph
  sortedHistory.forEach((item) => {
    if (!graph[item.title]) {
      graph[item.title] = new Map<string, number>();
    }
  });

  // Process direct comparisons from the watch history
  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i - 1];
    const curr = sortedHistory[i];

    // Skip if comparing the same title or if no comparison provided
    if (prev.title === curr.title || curr.betterThanPrevious === null) continue;

    // Record direct match
    addMatch(prev.title, curr.title);
    addMatch(curr.title, prev.title);

    if (curr.betterThanPrevious === true) {
      // Current movie is better than previous
      wins[curr.title]++;

      // Add or increment the edge in the graph
      const currentEdges = graph[curr.title];
      currentEdges.set(prev.title, (currentEdges.get(prev.title) || 0) + 1);
    } else {
      // Previous movie is better than current
      wins[prev.title]++;

      // Add or increment the edge in the graph
      const prevEdges = graph[prev.title];
      prevEdges.set(curr.title, (prevEdges.get(curr.title) || 0) + 1);
    }
  }

  // Compute transitive relationships using graph traversal
  // For each movie, find all movies it's transitively better than
  const computeTransitiveComparisons = () => {
    // Clone the graph to work with (we'll add transitive edges to this)
    const transitiveGraph: Record<string, Map<string, number>> = {};

    for (const title in graph) {
      transitiveGraph[title] = new Map(graph[title]);
    }

    // For each movie A, B, C: if A > B and B > C, then A > C
    // This is essentially the Floyd-Warshall algorithm for transitive closure
    for (const b in graph) {
      // intermediate movie
      for (const a in graph) {
        // start movie
        if (a === b) continue;

        // If A > B
        const aToB = transitiveGraph[a].get(b) || 0;
        if (aToB > 0) {
          // For all C where B > C, set A > C
          for (const [c, bToC] of graph[b].entries()) {
            if (a === c || b === c) continue;

            // How many times can we infer A > C via B
            const inferredCount = Math.min(aToB, bToC);
            if (inferredCount > 0) {
              const current = transitiveGraph[a].get(c) || 0;
              transitiveGraph[a].set(c, current + inferredCount);

              // Also update matches and wins
              addMatch(a, c);
              addMatch(c, a);
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

  // Get the list of unique titles.
  const items = Object.keys(wins);

  // Check if we have enough data to proceed
  const totalComparisons =
    Object.values(matches).reduce(
      (sum, matchObj) =>
        sum + Object.values(matchObj).reduce((s, v) => s + v, 0),
      0
    ) / 2; // Divide by 2 because we counted each match twice

  // Initialize ratings
  let ratings: Record<string, number>;

  if (totalComparisons === 0) {
    // No comparisons available, return equal ratings
    const equalRating = 1 / items.length;
    ratings = items.reduce((acc, item) => {
      acc[item] = equalRating;
      return acc;
    }, {} as Record<string, number>);
  } else {
    // Initialize ratings with a better strategy - use win percentages as starting point
    ratings = {};
    items.forEach((item) => {
      const totalMatches = Object.values(matches[item] || {}).reduce(
        (sum, count) => sum + count,
        0
      );
      ratings[item] = totalMatches > 0 ? wins[item] / totalMatches : 0.5;
    });

    // Add a prior/regularization factor
    const prior = 0.5;
    const priorStrength = 2; // Equivalent to 2 virtual matches with 50% win rate

    // Normalize initial ratings
    const initialTotal = Object.values(ratings).reduce(
      (sum, val) => sum + val,
      0
    );
    for (const key in ratings) {
      ratings[key] /= initialTotal;
      // Ensure no rating is exactly zero
      if (ratings[key] < 1e-10) ratings[key] = 1e-10;
    }

    const maxIterations = 1000;
    const convergenceThreshold = 1e-6;
    const damping = 0.5; // Increased damping for stability

    let lastDiff = Infinity;
    let nonImprovementCount = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newRatings: Record<string, number> = {};

      for (const i of items) {
        // Add prior for regularization
        const numerator = wins[i] + prior * priorStrength;
        let denominator = 0;

        if (matches[i]) {
          for (const j in matches[i]) {
            const n_ij = matches[i][j];
            // More stable formula that avoids division by very small numbers
            denominator += (n_ij * ratings[j]) / (ratings[i] + ratings[j]);
          }
        }

        // Add prior to denominator as well
        denominator += priorStrength;

        const updatedValue = numerator / denominator;

        // Apply damping: mix old and updated values
        newRatings[i] = (1 - damping) * ratings[i] + damping * updatedValue;
      }

      // Normalize newRatings so the sum equals 1
      const total = Object.values(newRatings).reduce(
        (sum, val) => sum + val,
        0
      );
      for (const key in newRatings) {
        newRatings[key] /= total;
      }

      // Check for convergence
      let diff = 0;
      for (const i of items) {
        diff += Math.abs(newRatings[i] - ratings[i]);
      }

      // Check if we're making progress
      if (diff >= lastDiff) {
        nonImprovementCount++;
        // If we haven't improved for several iterations, break
        if (nonImprovementCount >= 5) {
          console.log(
            `Stopping at iteration ${iter}: no improvement for 5 iterations`
          );
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

  // Convert the graph to a format suitable for visualization
  const graphForDisplay = {
    nodes: items.map((title) => ({
      id: title,
      rating: ratings[title],
    })),
    links: [] as Array<{ source: string; target: string; weight: number }>,
  };

  // Add the links (only include significant relationships)
  for (const source in graph) {
    for (const [target, weight] of graph[source].entries()) {
      // We can filter out weaker relationships if desired
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
    graph: graphForDisplay,
  };
};
