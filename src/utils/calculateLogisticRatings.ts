import * as tf from "@tensorflow/tfjs";

interface WatchEntry {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
}

type MovieRatings = { [title: string]: number };

export const calculateLogisticRatings = async (
  combinedHistory: WatchEntry[]
) => {
  try {
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
        "comparedTo" in comp
          ? movieIndexMap.get(comp.comparedTo as string)
          : comp.order > 1
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
      // console.error("No valid comparison data to train on.");
      // Handle appropriately - maybe return all zeros
    }

    const xTrain = tf.tensor2d(xDiffData, [xDiffData.length, numMovies]);
    const yTrain = tf.tensor2d(yData, [yData.length, 1]); // Shape [num_samples, 1] for binaryCrossentropy
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
      optimizer: tf.train.adam(0.01), // Adam optimizer with learning rate
      loss: "binaryCrossentropy", // Standard loss for logistic regression
    });

    // Train the model
    async function trainModel() {
      // console.log("Starting model training...");
      // Check if we have both classes (0 and 1) in the output
      const uniqueY = new Set(yData);
      if (uniqueY.size < 2) {
        // console.warn(
        //   "Training data only contains one class. Model will not learn effectively. Returning zero scores."
        // );
        return new Array(numMovies).fill(0); // Return neutral scores
      }

      await model.fit(xTrain, yTrain, {
        epochs: 100, // Number of training iterations (tune this)
        batchSize: 32, // How many samples per update (tune this)
        shuffle: true,
        // validationSplit: 0.1 // Optional: use part of data for validation
        callbacks: {
          // Optional: monitor training progress
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              // console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
            }
          },
        },
      });

      // Extract weights (scores)
      const weights = model.getWeights()[0]; // Get the kernel weights
      const scores = await weights.data(); // Get data as TypedArray asynchronously
      tf.dispose(weights); // Dispose tensor to free memory
      return Array.from(scores); // Convert TypedArray to regular array
    }

    // Run training and get scores
    // Need to wrap subsequent code in an async function or use .then()
    async function run() {
      const learnedScores = await trainModel();
      const finalRatings: MovieRatings = {};
      allTitles.forEach((title, index) => {
        finalRatings[title] = learnedScores[index] || 0; // Assign score or 0 if something went wrong
      });

      // Sort and print ratings
      const sortedRatings = Object.entries(finalRatings).sort(
        ([, scoreA], [, scoreB]) => scoreB - scoreA
      );

      // Optional: Calculate and print uncertain pairs based on finalRatings
      const uncertainPairs: [string, string][] = [];
      for (let i = 0; i < sortedRatings.length; i++) {
        for (let j = i + 1; j < sortedRatings.length; j++) {
          const [movie1, score1] = sortedRatings[i];
          const [movie2, score2] = sortedRatings[j];
          const uncertainty = Math.abs(score1 - score2);
          if (uncertainty > 0.5) {
            uncertainPairs.push([movie1, movie2]);
          }
        }
      }

      return {
        finalRatings,
        uncertainPairs,
      };
    }

    // Store the result from run() safely
    const runResult = await run().catch(() => {
      // console.error("Error during model training or processing:");
      return undefined; // Return undefined on error
    });

    // Check if runResult is defined and extract finalRatings
    const finalRatings = runResult ? runResult.finalRatings : {};

    // Dispose tensors now that training is complete
    tf.dispose([xTrain, yTrain]);

    return finalRatings;
  } catch {
    // console.error("Error during TensorFlow operations:");
    // Handle the error appropriately, maybe return empty ratings
    return {};
  }
};
