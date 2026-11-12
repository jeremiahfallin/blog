import fs from "fs/promises";
import path from "path";
import watchHistory from "../src/movie-watch-history.json";
import { calculateRatings } from "../src/utils/calculateRatings";
// Pure-JS TensorFlow.js. The model is one weight per film over a few hundred
// comparisons, so the native `@tensorflow/tfjs-node` backend is not worth its
// install weight or its unpatched install-time dependencies (tar, adm-zip).
import * as tf from "@tensorflow/tfjs";
import { calculateLogisticRatingsWithBackend } from "../src/utils/logisticRatingsCore";

const getViewCounts = () => {
  const counts: Record<string, number> = {};
  watchHistory.forEach((movie) => {
    counts[movie.title] = (counts[movie.title] || 0) + 1;
  });
  return counts;
};

async function run() {
  console.log("Calculating movie scores at build-time...");
  const viewCounts = getViewCounts();
  const ratings = calculateRatings(watchHistory);
  const logisticRatings = await calculateLogisticRatingsWithBackend(
    tf,
    watchHistory
  );

  const moviesWithScores = watchHistory.map((watch) => ({
    ...watch,
    btscore: 100 * (ratings.ratings[watch.title] || 0),
    bayesianUncertainty: ratings.uncertainties[watch.title] || 0,
    viewCount: viewCounts[watch.title],
    logisticScore:
      logisticRatings[watch.title] !== undefined
        ? logisticRatings[watch.title]
        : null,
  }));

  const compiledData = {
    movies: moviesWithScores,
    cycles: ratings.cycles,
    graph: ratings.graph,
  };

  const dataDir = path.join(process.cwd(), "src", "data");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, "calculated-ratings.json"),
    JSON.stringify(compiledData, null, 2),
    "utf-8"
  );
  console.log("Calculated ratings written to src/data/calculated-ratings.json!");
}

run().catch((err) => {
  console.error("Fatal error running build-time ratings calculation:", err);
  process.exit(1);
});
