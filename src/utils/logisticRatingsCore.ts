import type * as tfTypes from "@tensorflow/tfjs";

export interface WatchEntry {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
}

export type MovieRatings = { [title: string]: number };

export interface LogisticRatingsOptions {
  /**
   * L2 penalty strength (λ). Equivalent to a Gaussian prior with variance 1/λ
   * on every film's score, so the default of 1 says "before any comparisons,
   * a film's score is 0 give or take 1".
   */
  regularization?: number;
  /** Number of full-batch gradient-descent steps. */
  epochs?: number;
  verbose?: boolean;
}

const DEFAULT_REGULARIZATION = 1;
const DEFAULT_EPOCHS = 500;

/**
 * The slice of the TensorFlow.js API this module relies on. The build script
 * injects pure-JS `@tensorflow/tfjs`; any backend exposing this slice works.
 */
export type TfBackend = Pick<
  typeof tfTypes,
  "ready" | "tensor2d" | "sequential" | "layers" | "train" | "regularizers"
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

/**
 * Fit a bias-free, L2-regularized logistic regression over the pairwise
 * comparisons and return the learned per-title scores. The TF backend is
 * injected rather than imported here, so this module never pulls TensorFlow
 * into a bundle.
 *
 * The scores minimize
 *
 *     -Σ log P(observed outcome)  +  (λ/2) · Σ score²
 *
 * where P(a beats b) = sigmoid(score_a - score_b). The penalty matters: a
 * watch history without contradictions is perfectly separable, so without it
 * the scores grow for as long as training runs and their size only reflects
 * when training stopped. With it the problem has one answer, which plain
 * full-batch gradient descent reaches regardless of sample order or seed.
 */
export async function calculateLogisticRatingsWithBackend(
  tf: TfBackend,
  history: WatchEntry[],
  options?: LogisticRatingsOptions
): Promise<MovieRatings> {
  const regularization = options?.regularization ?? DEFAULT_REGULARIZATION;
  const epochs = options?.epochs ?? DEFAULT_EPOCHS;
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

    const sampleCount = xDiffData.length;

    // The most comparisons any one film takes part in. Every comparison is in
    // xDiffData twice (once mirrored), hence the division by 2.
    const appearances = new Array<number>(numMovies).fill(0);
    for (const row of xDiffData) {
      row.forEach((value, index) => {
        if (value !== 0) appearances[index]++;
      });
    }
    const maxComparisons = Math.max(...appearances) / 2;

    // The objective's curvature is at most maxComparisons / 2 + λ, so a step
    // of one over that bound is guaranteed to converge however often a film
    // has been rewatched.
    const stepSize = 1 / (maxComparisons / 2 + regularization);

    // TensorFlow's loss is the mean over samples, i.e. the objective above
    // times 2 / sampleCount, so the penalty and the step are rescaled to match.
    const l2 = regularization / sampleCount;
    const learningRate = (stepSize * sampleCount) / 2;

    const xTrain = tf.tensor2d(xDiffData, [sampleCount, numMovies]);
    const yTrain = tf.tensor2d(
      yData.map((y) => [y]),
      [sampleCount, 1]
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
        kernelRegularizer: tf.regularizers.l2({ l2 }),
      })
    );

    model.compile({
      optimizer: tf.train.sgd(learningRate),
      loss: "binaryCrossentropy",
    });

    try {
      await model.fit(xTrain, yTrain, {
        epochs,
        batchSize: sampleCount, // Full batch: sample order cannot matter.
        shuffle: false,
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
