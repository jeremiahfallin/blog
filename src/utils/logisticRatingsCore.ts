import type * as tfTypes from "@tensorflow/tfjs";

export interface WatchEntry {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
}

export type MovieRatings = { [title: string]: number };

export interface LogisticRatingsOptions {
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  validationSplit?: number;
  verbose?: boolean;
}

/**
 * The slice of the TensorFlow.js API this module relies on. Both
 * `@tensorflow/tfjs` (browser) and `@tensorflow/tfjs-node` (build script)
 * satisfy it, so callers inject whichever backend they have.
 */
export type TfBackend = Pick<
  typeof tfTypes,
  "ready" | "tensor2d" | "sequential" | "layers" | "train"
>;

export interface ComparisonData {
  allTitles: string[];
  numMovies: number;
  xDiffData: number[][];
  yData: number[];
}

/**
 * Turn a watch history into pairwise training samples for the logistic model.
 *
 * Each entry is compared against the film watched immediately before it (by
 * `order`, not array position — we sort defensively like `calculateRatings`).
 * Entries with `betterThanPrevious === null` carry no comparison and are
 * skipped. Every real comparison contributes a sample and its complement so
 * the model sees the relationship symmetrically.
 */
export function buildComparisonData(history: WatchEntry[]): ComparisonData {
  const sortedHistory = [...history].sort((a, b) => a.order - b.order);

  const allTitles = [...new Set(sortedHistory.map((e) => e.title))].sort();
  const movieIndexMap = new Map(allTitles.map((title, index) => [title, index]));
  const numMovies = allTitles.length;

  const xDiffData: number[][] = [];
  const yData: number[] = [];

  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i - 1];
    const curr = sortedHistory[i];

    if (curr.betterThanPrevious === null) continue;

    const idx1 = movieIndexMap.get(curr.title);
    const idx2 = movieIndexMap.get(prev.title);
    if (idx1 === undefined || idx2 === undefined) continue;

    const diffVector = new Array(numMovies).fill(0);
    diffVector[idx1] = 1;
    diffVector[idx2] = -1;

    const outcome = curr.betterThanPrevious ? 1 : 0;

    xDiffData.push(diffVector);
    yData.push(outcome);

    // Complementary sample: flipping the difference flips the outcome.
    xDiffData.push(diffVector.map((v) => -v));
    yData.push(1 - outcome);
  }

  return { allTitles, numMovies, xDiffData, yData };
}

/**
 * Train a bias-free logistic-regression model over the pairwise comparisons
 * and return the learned per-title scores. The TF backend is injected so the
 * same implementation runs in the browser (`@tensorflow/tfjs`) and at build
 * time on the native backend (`@tensorflow/tfjs-node`).
 */
export async function calculateLogisticRatingsWithBackend(
  tf: TfBackend,
  history: WatchEntry[],
  options?: LogisticRatingsOptions
): Promise<MovieRatings> {
  const learningRate = options?.learningRate ?? 0.01;
  const epochs = options?.epochs ?? 100;
  const batchSize = options?.batchSize ?? 32;
  const validationSplit = options?.validationSplit ?? 0;
  const verbose = options?.verbose ?? false;

  try {
    await tf.ready();

    const { allTitles, numMovies, xDiffData, yData } =
      buildComparisonData(history);

    if (xDiffData.length === 0) {
      console.warn("No valid comparison data to train on.");
      return {};
    }

    // With a single output class the model cannot learn a meaningful ranking.
    if (new Set(yData).size < 2) {
      console.warn(
        "Training data only contains one class. Returning neutral scores."
      );
      return Object.fromEntries(allTitles.map((title) => [title, 0]));
    }

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
        useBias: false, // Weights represent per-title scores directly.
      })
    );

    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: "binaryCrossentropy",
    });

    try {
      await model.fit(xTrain, yTrain, {
        epochs,
        batchSize,
        shuffle: true,
        validationSplit,
        verbose: verbose ? 1 : 0,
      });

      const weights = model.getWeights()[0];
      const scores = Array.from(await weights.data());
      weights.dispose();

      const finalRatings: MovieRatings = {};
      allTitles.forEach((title, index) => {
        finalRatings[title] = scores[index] || 0;
      });
      return finalRatings;
    } finally {
      xTrain.dispose();
      yTrain.dispose();
    }
  } catch (e) {
    console.error("Error during TensorFlow operations:", e);
    return {};
  }
}
