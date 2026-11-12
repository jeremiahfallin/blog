import fs from "fs/promises";
import path from "path";
import type { RatingsData } from "../src/types/ratings";

/**
 * Rank candidate "watch these two back-to-back" comparisons by expected
 * information gain, to decide which rewatch sharpens the rating system most.
 *
 * Why this works: the only thing a watch produces in `calculateRatings` /
 * `buildComparisonData` is a single pairwise comparison edge against the film
 * watched immediately before it. So the information a rewatch gathers is the
 * information in that one new edge (X vs Y). We therefore score *pairs* and
 * report which movie is worth rewatching to create the best pair.
 *
 * The score factors into three terms, all computable from the current
 * calculated-ratings.json — no retraining required:
 *
 *   gain(i,j) ≈ p_ij·(1 − p_ij)  ·  (σ²_i + σ²_j)  ·  bridgeBonus(i,j)
 *              └── outcome ─┘       └─ parameter ─┘   └── structure ──┘
 *                 surprise              room
 *
 *   1. Outcome surprise — binary/Fisher term p(1−p). In Bradley-Terry the
 *      predicted win prob is p_ij = r_i/(r_i+r_j). Peaks at a 50/50 toss-up
 *      (movies rated close together); ~0 for a foregone conclusion.
 *   2. Parameter room — current posterior variance, using the model's own
 *      `bayesianUncertainty` (Laplace SD, already in probability space).
 *      Favors thinly- or stale-compared films over saturated ones.
 *   3. Structure — a multiplier when i and j live in different connected
 *      components of the current comparison graph. Such an edge localizes
 *      whole clusters relative to each other, so it carries outsized info.
 *
 * Objective: global information gain (sharpen the whole ranking).
 */

const BRIDGE_BONUS = 4; // multiplier for edges that join two components
const TOP_PAIRS = 25;
const TOP_MOVIES = 20;

type Movie = {
  title: string;
  rating: number; // BT rating on the simplex (btscore / 100)
  uncertainty: number; // bayesianUncertainty (prob space)
  viewCount: number;
};

async function main() {
  const jsonPath = path.join(
    process.cwd(),
    "src",
    "data",
    "calculated-ratings.json"
  );
  const data: RatingsData = JSON.parse(await fs.readFile(jsonPath, "utf-8"));

  // The movies array holds one row per watch; collapse to unique titles.
  const byTitle = new Map<string, Movie>();
  for (const m of data.movies) {
    if (byTitle.has(m.title)) continue;
    byTitle.set(m.title, {
      title: m.title,
      rating: m.btscore / 100,
      uncertainty: m.bayesianUncertainty ?? 0,
      viewCount: m.viewCount,
    });
  }
  const movies = [...byTitle.values()];

  // Connected components of the undirected comparison graph.
  const component = connectedComponents(
    movies.map((m) => m.title),
    data.graph.links
  );
  const componentSizes = new Map<number, number>();
  for (const c of component.values())
    componentSizes.set(c, (componentSizes.get(c) ?? 0) + 1);
  const numComponents = componentSizes.size;

  // Score every unordered pair.
  type Scored = { a: Movie; b: Movie; gain: number; p: number; bridged: boolean };
  const pairs: Scored[] = [];
  for (let i = 0; i < movies.length; i++) {
    for (let j = i + 1; j < movies.length; j++) {
      const a = movies[i];
      const b = movies[j];
      const denom = a.rating + b.rating;
      if (denom <= 0) continue;
      const p = a.rating / denom; // BT: P(a beats b)

      const surprise = p * (1 - p); // Fisher / outcome-entropy term
      const room = a.uncertainty ** 2 + b.uncertainty ** 2; // parameter term
      const bridged = component.get(a.title) !== component.get(b.title);
      const bridge = bridged ? BRIDGE_BONUS : 1;

      const gain = surprise * room * bridge;
      if (gain > 0) pairs.push({ a, b, gain, p, bridged });
    }
  }

  pairs.sort((x, y) => y.gain - x.gain);

  // Aggregate: each movie's best available pairing → which single rewatch helps most.
  const bestForMovie = new Map<string, Scored>();
  for (const pr of pairs) {
    for (const m of [pr.a, pr.b]) {
      const cur = bestForMovie.get(m.title);
      if (!cur || pr.gain > cur.gain) bestForMovie.set(m.title, pr);
    }
  }

  const fmt = (n: number, d = 3) => n.toFixed(d);

  console.log(
    `\n${movies.length} unique films · ${data.graph.links.length} comparison edges · ${numComponents} connected component(s)\n`
  );

  console.log(`── Top ${TOP_PAIRS} comparisons by expected information gain ──`);
  console.log("(watch these two back-to-back; ★ = bridges two components)\n");
  for (const pr of pairs.slice(0, TOP_PAIRS)) {
    const flag = pr.bridged ? "★" : " ";
    console.log(
      `${flag} gain ${fmt(pr.gain, 5)}  p≈${fmt(pr.p, 2)}  ` +
        `${pr.a.title}  ⟷  ${pr.b.title}`
    );
  }

  console.log(`\n── Top ${TOP_MOVIES} single films to rewatch ──`);
  console.log("(best pairing that film can be part of)\n");
  const rankedMovies = [...bestForMovie.entries()]
    .sort((x, y) => y[1].gain - x[1].gain)
    .slice(0, TOP_MOVIES);
  for (const [title, pr] of rankedMovies) {
    const partner = pr.a.title === title ? pr.b.title : pr.a.title;
    const flag = pr.bridged ? "★" : " ";
    console.log(
      `${flag} gain ${fmt(pr.gain, 5)}  ${title}  →  watch alongside “${partner}”`
    );
  }
  console.log("");
}

/** Union-find over the undirected edge list; returns title → component id. */
function connectedComponents(
  titles: string[],
  links: RatingsData["graph"]["links"]
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

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
