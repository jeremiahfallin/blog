import fs from "fs/promises";
import path from "path";
import type { RatingsData } from "../src/types/ratings";
import {
  connectedComponents,
  scoreRewatchPairs,
  type RewatchFilm,
  type RewatchPair,
} from "../src/utils/rewatchSuggestions";

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
 * The scoring itself lives in `src/utils/rewatchSuggestions.ts`; everything
 * it needs comes from the current calculated-ratings.json, so no retraining
 * is required. Pairs that have already been compared directly are skipped.
 *
 * Objective: global information gain (sharpen the whole ranking).
 */

const TOP_PAIRS = 25;
const TOP_MOVIES = 20;

async function main() {
  const jsonPath = path.join(
    process.cwd(),
    "src",
    "data",
    "calculated-ratings.json"
  );
  const data: RatingsData = JSON.parse(await fs.readFile(jsonPath, "utf-8"));

  // The movies array holds one row per watch; collapse to unique titles.
  const byTitle = new Map<string, RewatchFilm>();
  for (const m of data.movies) {
    if (byTitle.has(m.title)) continue;
    if (m.bayesianUncertainty === undefined) {
      throw new Error(
        `"${m.title}" has no bayesianUncertainty; re-run the ratings build.`
      );
    }
    byTitle.set(m.title, {
      title: m.title,
      rating: m.btscore / 100,
      uncertainty: m.bayesianUncertainty,
    });
  }
  const movies = [...byTitle.values()];

  const numComponents = new Set(
    connectedComponents(
      movies.map((m) => m.title),
      data.graph.links
    ).values()
  ).size;

  const pairs = scoreRewatchPairs(movies, data.graph.links);

  // Aggregate: each movie's best available pairing → which single rewatch helps most.
  const bestForMovie = new Map<string, RewatchPair>();
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
      `${flag} gain ${fmt(pr.gain, 4)}  p≈${fmt(pr.p, 2)}  ` +
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
      `${flag} gain ${fmt(pr.gain, 4)}  ${title}  →  watch alongside “${partner}”`
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
