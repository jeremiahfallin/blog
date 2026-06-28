import fs from "fs/promises";
import path from "path";
import watchHistory from "../src/movie-watch-history.json";
import { calculateRatings } from "../src/utils/calculateRatings";
import {
  calculateLogisticRatingsWithBackend,
  type TfBackend,
} from "../src/utils/logisticRatingsCore";

async function calculateServerLogisticRatings() {
  let tf: TfBackend;
  try {
    tf = await import("@tensorflow/tfjs-node");
    console.log("Using TensorFlow.js Node backend for script calculation");
  } catch (e) {
    console.error(
      "Failed to import tfjs-node, falling back to browser version:",
      e
    );
    tf = await import("@tensorflow/tfjs");
  }

  return calculateLogisticRatingsWithBackend(tf, watchHistory);
}

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
  const logisticRatings = await calculateServerLogisticRatings();

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
