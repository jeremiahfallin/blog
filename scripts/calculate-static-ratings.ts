import fs from "fs/promises";
import path from "path";
import watchHistory from "../src/movie-watch-history.json";
import { calculateRatings } from "../src/utils/calculateRatings";
import { calculateLogisticRatings as calculateClientLogisticRatings } from "../src/utils/calculateLogisticRatings";

async function calculateServerLogisticRatings() {
  try {
    let tf;
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

    await tf.ready();

    const xDiffData: number[][] = [];
    const yData: number[] = [];

    const allTitles = [
      ...new Set(watchHistory.map((entry) => entry.title)),
    ].sort();
    const movieIndexMap = new Map(
      allTitles.map((title, index) => [title, index])
    );
    const numMovies = allTitles.length;

    watchHistory.forEach((movie) => {
      const idx1 = movieIndexMap.get(movie.title);
      const idx2 =
        movie.order > 1
          ? movieIndexMap.get(watchHistory[movie.order - 2]?.title)
          : undefined;

      if (
        idx1 !== undefined &&
        idx2 !== undefined &&
        movie.betterThanPrevious !== null
      ) {
        const diffVector = new Array(numMovies).fill(0);
        diffVector[idx1] = 1;
        diffVector[idx2] = -1;

        const outcome = movie.betterThanPrevious ? 1 : 0;

        xDiffData.push(diffVector);
        yData.push(outcome);

        xDiffData.push(diffVector.map((v) => -v));
        yData.push(1 - outcome);
      }
    });

    const xTrain = tf.tensor2d(xDiffData, [xDiffData.length, numMovies]);
    const yTrain = tf.tensor2d(
      yData.map((y) => [y]),
      [yData.length, 1]
    );

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 1,
        inputShape: [numMovies],
        activation: "sigmoid",
        useBias: false,
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "binaryCrossentropy",
    });

    await model.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 32,
      shuffle: true,
      verbose: 0,
    });

    const weights = model.getWeights()[0];
    const scores = await weights.data();
    const finalRatings: Record<string, number> = {};

    allTitles.forEach((title, index) => {
      finalRatings[title] = Array.from(scores)[index] || 0;
    });

    weights.dispose();
    xTrain.dispose();
    yTrain.dispose();

    return finalRatings;
  } catch (error) {
    console.error("Error computing script-side logistic ratings:", error);
    return calculateClientLogisticRatings(watchHistory);
  }
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
