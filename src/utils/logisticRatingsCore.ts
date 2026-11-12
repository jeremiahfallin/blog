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
 * The slice of the TensorFlow.js API this module relies on. The build script
 * injects pure-JS `@tensorflow/tfjs`; any backend exposing this slice works.
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
    // A back-to-back rewatch compares a film with itself. It carries no
    // information, and encoding it would collapse the difference vector to a
    // lone -1 and push the film's own score the wrong way.
    if (prev.title === curr.title) continue;

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

const TRAINING_ORDER_SEED = 1;

/** Small seeded generator (mulberry32) returning values in [0, 1). */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Train a bias-free logistic-regression model over the pairwise comparisons
 * and return the learned per-title scores. The TF backend is injected rather
 * than imported here, so this module never pulls TensorFlow into a bundle.
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

    // Shuffle the samples once with a seeded generator. Letting `fit` shuffle
    // would use Math.random and make the scores differ on every build.
    const order = xDiffData.map((_, i) => i);
    const random = seededRandom(TRAINING_ORDER_SEED);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const xTrain = tf.tensor2d(
      order.map((i) => xDiffData[i]),
      [xDiffData.length, numMovies]
    );
    const yTrain = tf.tensor2d(
      order.map((i) => [yData[i]]),
      [yData.length, 1]
    );

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 1,
        inputShape: [numMovies],
        activation: "sigmoid",
        useBias: false, // Weights represent per-title scores directly.
        // Start every film at 0 instead of a random weight. A single-layer
        // logistic regression is convex, so there is no symmetry to break,
        // and a fixed start makes the result repeatable.
        kernelInitializer: "zeros",
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
        shuffle: false, // Already shuffled above, deterministically.
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
