import * as tf from "@tensorflow/tfjs";
import { Logs } from "@tensorflow/tfjs-layers/dist/logs";

interface WatchEntry {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
}

type MovieRatings = { [title: string]: number };

export const calculateLogisticRatings = async (
  combinedHistory: WatchEntry[],
  options?: {
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    verbose?: boolean;
  }
) => {
  try {
    const learningRate = options?.learningRate ?? 0.01;
    const epochs = options?.epochs ?? 100;
    const batchSize = options?.batchSize ?? 32;
    const verbose = options?.verbose ?? false;
    // Ensure TensorFlow.js backend is ready
    await tf.ready();

    const xDiffData: number[][] = [];
    const yData: number[] = [];

    const allTitles = [
      ...new Set(combinedHistory.map((entry) => entry.title)),
    ].sort();
    const movieIndexMap = new Map(
      allTitles.map((title, index) => [title, index])
    );
    const numMovies = allTitles.length;

    combinedHistory.forEach((comp) => {
      const idx1 = movieIndexMap.get(comp.title);
      // Check if this is a comparison entry with a comparedTo property
      const idx2 =
        comp.order > 1
          ? movieIndexMap.get(combinedHistory[comp.order - 2]?.title)
          : undefined;

      if (idx1 !== undefined && idx2 !== undefined) {
        const diffVector = new Array(numMovies).fill(0);
        diffVector[idx1] = 1;
        diffVector[idx2] = -1;

        const outcome = comp.betterThanPrevious ? 1 : 0;

        xDiffData.push(diffVector);
        yData.push(outcome);

        // Add complementary sample
        xDiffData.push(diffVector.map((v) => -v));
        yData.push(1 - outcome);
      }
    });

    if (xDiffData.length === 0) {
      console.warn("No valid comparison data to train on.");
      // Return empty ratings
      return {};
    }

    const xTrain = tf.tensor2d(xDiffData, [xDiffData.length, numMovies]);
    // Convert yData to 2D tensor with shape [num_samples, 1]
    const yTrain = tf.tensor2d(
      yData.map((y) => [y]),
      [yData.length, 1]
    );

    // Define the model
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 1, // Single output neuron
        inputShape: [numMovies],
        activation: "sigmoid", // For logistic regression probability
        useBias: false, // Crucial: weights represent scores directly
      })
    );

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(learningRate), // Adam optimizer with learning rate
      loss: "binaryCrossentropy", // Standard loss for logistic regression
    });

    // Train the model
    async function trainModel() {
      console.log("Starting model training...");
      // Check if we have both classes (0 and 1) in the output
      const uniqueY = new Set(yData);
      if (uniqueY.size < 2) {
        console.warn(
          "Training data only contains one class. Model will not learn effectively. Returning zero scores."
        );
        return new Array(numMovies).fill(0); // Return neutral scores
      }

      await model.fit(xTrain, yTrain, {
        epochs: epochs, // Number of training iterations (tune this)
        batchSize: batchSize, // How many samples per update (tune this)
        shuffle: true,
        validationSplit: 0.1, // Optional: use part of data for validation
        callbacks: {
          onEpochEnd: (epoch: number, logs?: Logs) => {
            if (verbose && logs) {
              // logs can be undefined
              let logOutput = `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(
                4
              )}`;
              if (logs.val_loss !== undefined) {
                // Check if validation loss is available
                logOutput += `, val_loss = ${logs.val_loss.toFixed(4)}`;
              }
              console.log(logOutput);
            }
          },
        },
      });

      // Extract weights (scores)
      const weights = model.getWeights()[0]; // Get the kernel weights
      const scores = await weights.data(); // Get data as TypedArray asynchronously
      const weightsArray = Array.from(scores); // Convert TypedArray to regular array
      weights.dispose(); // Dispose tensor to free memory

      return weightsArray;
    }

    // Run training and get scores
    // Need to wrap subsequent code in an async function or use .then()
    async function run() {
      const learnedScores = await trainModel();
      const finalRatings: MovieRatings = {};
      allTitles.forEach((title, index) => {
        finalRatings[title] = learnedScores[index] || 0; // Assign score or 0 if something went wrong
      });

      console.log("Logistic ratings calculation complete");
      return {
        finalRatings,
      };
    }

    // Store the result from run() safely
    const runResult = await run().catch((e) => {
      console.error("Error during model training or processing:", e);
      return undefined; // Return undefined on error
    });

    // Check if runResult is defined and extract finalRatings
    const finalRatings = runResult ? runResult.finalRatings : {};

    // Dispose tensors now that training is complete
    xTrain.dispose();
    yTrain.dispose();

    return finalRatings;
  } catch (e) {
    console.error("Error during TensorFlow operations:", e);
    // Handle the error appropriately, maybe return empty ratings
    return {};
  }
};
