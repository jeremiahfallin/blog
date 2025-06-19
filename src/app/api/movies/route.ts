import { NextResponse } from "next/server";
import watchHistory from "@/movie-watch-history.json";
import { calculateRatings } from "@/utils/calculateRatings";
import { calculateLogisticRatings as calculateClientLogisticRatings } from "@/utils/calculateLogisticRatings";

// This server-side calculation function is available only in the API route
// It will use TensorFlow.js Node when deployed
async function calculateServerLogisticRatings() {
  try {
    // We're in a server environment so we can safely import tfjs-node
    let tf;
    try {
      // Try to import tfjs-node for better performance on the server
      tf = await import("@tensorflow/tfjs-node");
      console.log("Using TensorFlow.js Node backend");
    } catch (e) {
      // Fallback to browser version if tfjs-node isn't available
      console.error(
        "Failed to import tfjs-node, falling back to browser version:",
        e
      );
      tf = await import("@tensorflow/tfjs");
    }

    // Initialize TensorFlow
    await tf.ready();

    // Setup data structures for model training
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

        // Add complementary sample for better training
        xDiffData.push(diffVector.map((v) => -v));
        yData.push(1 - outcome);
      }
    });

    // Prepare tensors and model
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

    // Train the model
    await model.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 32,
      shuffle: true,
      verbose: 1,
    });

    // Extract weights (scores)
    const weights = model.getWeights()[0];
    const scores = await weights.data();
    const finalRatings: Record<string, number> = {};

    allTitles.forEach((title, index) => {
      finalRatings[title] = Array.from(scores)[index] || 0;
    });

    // Cleanup
    weights.dispose();
    xTrain.dispose();
    yTrain.dispose();

    return finalRatings;
  } catch (error) {
    console.error("Error computing server-side logistic ratings:", error);
    // Fallback to client implementation if there's an error
    return calculateClientLogisticRatings(watchHistory);
  }
}

// Define types for our movie data
type WatchHistoryEntry = (typeof watchHistory)[number];
type WatchHistoryWithScore = WatchHistoryEntry & {
  btscore: number;
  viewCount: number;
  logisticScore: number | null;
};

// Calculate view counts
const getViewCounts = () => {
  const counts: Record<string, number> = {};
  watchHistory.forEach((movie) => {
    counts[movie.title] = (counts[movie.title] || 0) + 1;
  });
  return counts;
};

// Move these calculations outside the handler so they're only calculated once per server instance
let cachedMovies: WatchHistoryWithScore[] | null = null;
let lastCalculated = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function GET() {
  // Check if we have a valid cache
  const now = Date.now();
  if (cachedMovies && now - lastCalculated < CACHE_DURATION) {
    return NextResponse.json(cachedMovies, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  }

  try {
    // Calculate ratings and logistic ratings
    const viewCounts = getViewCounts();
    const ratings = calculateRatings(watchHistory);

    // Use the server-optimized calculation for logistic ratings
    const logisticRatings = await calculateServerLogisticRatings();

    // Combine the watch history with calculated scores
    const moviesWithScores = watchHistory.map((watch) => ({
      ...watch,
      btscore: 100 * (ratings.ratings[watch.title] || 0),
      viewCount: viewCounts[watch.title],
      logisticScore:
        logisticRatings[watch.title] !== undefined
          ? logisticRatings[watch.title]
          : null,
    }));

    // Update the cache
    cachedMovies = moviesWithScores;
    lastCalculated = now;

    // Return the response with appropriate caching headers
    return NextResponse.json(moviesWithScores, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error calculating movie scores:", error);
    return NextResponse.json(
      { error: "Failed to calculate movie scores" },
      { status: 500 }
    );
  }
}
