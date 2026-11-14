/**
 * Score candidate "watch these two back-to-back" comparisons by how much a
 * single new comparison between them is expected to teach the rating model.
 */

export type RewatchFilm = {
  title: string;
  /** Bradley-Terry rating: the film's share of total strength. */
  rating: number;
  /** Posterior standard deviation of the film's log-strength. */
  uncertainty: number;
};

export type ComparedPair = { source: string; target: string };

export type RewatchPair = {
  a: RewatchFilm;
  b: RewatchFilm;
  /** Expected information gain in nats, times the bridge bonus if bridged. */
  gain: number;
  /** Predicted probability that `a` is preferred to `b`. */
  p: number;
  /** True when the pair joins two separate components of the graph. */
  bridged: boolean;
};

export type RewatchOptions = {
  /** Multiplier for a pair that joins two components. */
  bridgeBonus?: number;
};

const DEFAULT_BRIDGE_BONUS = 4;

/**
 * Score every pair of films that has not been compared directly yet, best
 * first.
 *
 * The outcome of a comparison depends only on the difference of the two
 * log-strengths, d = θ_a − θ_b. Observing one outcome with predicted
 * probability p adds Fisher information p(1 − p) about d, so for a roughly
 * Gaussian posterior with variance v the expected information gain is
 *
 *     gain = ½ · ln(1 + p(1 − p) · v),     v ≈ σ_a² + σ_b²
 *
 * (v ignores the posterior covariance between the two films, in line with
 * the diagonal approximation the uncertainties come from). The gain is high
 * for a toss-up between two films whose scores are loosely pinned down and
 * does not depend on where in the ranking the pair sits.
 *
 * A pair in different connected components of the comparison graph gets a
 * bonus: that one comparison places two whole clusters relative to each
 * other, which the per-film variances do not capture.
 */
export function scoreRewatchPairs(
  films: RewatchFilm[],
  comparedPairs: ComparedPair[],
  options?: RewatchOptions
): RewatchPair[] {
  const bridgeBonus = options?.bridgeBonus ?? DEFAULT_BRIDGE_BONUS;

  const component = connectedComponents(
    films.map((f) => f.title),
    comparedPairs
  );

  const pairKey = (x: string, y: string) => JSON.stringify([x, y].sort());
  const alreadyCompared = new Set(
    comparedPairs.map((l) => pairKey(l.source, l.target))
  );

  const pairs: RewatchPair[] = [];
  for (let i = 0; i < films.length; i++) {
    for (let j = i + 1; j < films.length; j++) {
      const a = films[i];
      const b = films[j];
      if (alreadyCompared.has(pairKey(a.title, b.title))) continue;

      const totalRating = a.rating + b.rating;
      if (totalRating <= 0) continue;
      const p = a.rating / totalRating;

      const variance = a.uncertainty ** 2 + b.uncertainty ** 2;
      const information = 0.5 * Math.log(1 + p * (1 - p) * variance);

      const bridged = component.get(a.title) !== component.get(b.title);
      const gain = information * (bridged ? bridgeBonus : 1);

      if (gain > 0) pairs.push({ a, b, gain, p, bridged });
    }
  }

  return pairs.sort((x, y) => y.gain - x.gain);
}

/** Union-find over the undirected edge list; returns title → component id. */
export function connectedComponents(
  titles: string[],
  links: ComparedPair[]
): Map<string, number> {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) {
      const next = parent.get(x)!;
      parent.set(x, r);
      x = next;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const t of titles) parent.set(t, t);
  for (const l of links) {
    if (parent.has(l.source) && parent.has(l.target)) union(l.source, l.target);
  }

  const rootToId = new Map<string, number>();
  const result = new Map<string, number>();
  for (const t of titles) {
    const root = find(t);
    if (!rootToId.has(root)) rootToId.set(root, rootToId.size);
    result.set(t, rootToId.get(root)!);
  }
  return result;
}
