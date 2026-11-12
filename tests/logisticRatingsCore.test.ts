import assert from "node:assert/strict";
import * as tf from "@tensorflow/tfjs";
import {
  buildComparisonData,
  calculateLogisticRatingsWithBackend,
} from "../src/utils/logisticRatingsCore";

const normalizeZeros = (arr: number[]) => arr.map((v) => v + 0);

type TestFn = () => void | Promise<void>;
type Test = { name: string; fn: TestFn };
const tests: Test[] = [];
const test = (name: string, fn: TestFn) => tests.push({ name, fn });

test("skips entries whose betterThanPrevious is null", () => {
  const history = [
    { order: 1, title: "A", dateWatched: "2024-01-01", betterThanPrevious: null },
    { order: 2, title: "B", dateWatched: "2024-01-02", betterThanPrevious: null },
    { order: 3, title: "C", dateWatched: "2024-01-03", betterThanPrevious: true },
  ];

  const { allTitles, xDiffData, yData } = buildComparisonData(history);

  assert.deepEqual(allTitles, ["A", "B", "C"]);
  // Only the C-vs-B comparison is real; both null entries are skipped.
  // One real comparison => one sample + one complement = 2 rows.
  assert.equal(xDiffData.length, 2);
  assert.deepEqual(yData, [1, 0]);
  // C (idx 2) better than B (idx 1): diff vector is +1 at C, -1 at B.
  // (normalize -0 -> 0; negating zeros is numerically harmless)
  assert.deepEqual(normalizeZeros(xDiffData[0]), [0, -1, 1]);
  assert.deepEqual(normalizeZeros(xDiffData[1]), [0, 1, -1]);
});

test("compares against the previous film by order, not array position", () => {
  // Deliberately out of array order: index 0 holds order 2.
  const history = [
    { order: 2, title: "B", dateWatched: "2024-01-02", betterThanPrevious: true },
    { order: 1, title: "A", dateWatched: "2024-01-01", betterThanPrevious: null },
  ];

  const { allTitles, xDiffData, yData } = buildComparisonData(history);

  assert.deepEqual(allTitles, ["A", "B"]);
  // B (order 2) is "better than" its true predecessor A (order 1).
  assert.equal(xDiffData.length, 2);
  assert.deepEqual(yData, [1, 0]);
  // B (idx 1) better than A (idx 0): +1 at B, -1 at A.
  assert.deepEqual(normalizeZeros(xDiffData[0]), [-1, 1]);
});

test("skips a film compared against itself (back-to-back rewatch)", () => {
  const history = [
    { order: 1, title: "A", dateWatched: "2024-01-01", betterThanPrevious: null },
    { order: 2, title: "B", dateWatched: "2024-01-02", betterThanPrevious: true },
    // B again, marked "better than previous" — but the previous film is B.
    { order: 3, title: "B", dateWatched: "2024-01-03", betterThanPrevious: true },
  ];

  const { xDiffData, yData } = buildComparisonData(history);

  // Only B-vs-A is a real comparison; B-vs-B says nothing about B, and
  // encoding it would push B's own score down.
  assert.equal(xDiffData.length, 2);
  assert.deepEqual(yData, [1, 0]);
  assert.deepEqual(normalizeZeros(xDiffData[0]), [-1, 1]);
});

test("produces identical scores on repeated runs", async () => {
  // E beats A, B and D; F loses to B and D; A loses to B, D and E.
  const outcomes: [string, boolean | null][] = [
    ["A", null], ["B", true], ["C", false], ["D", true], ["A", false],
    ["E", true], ["B", false], ["F", false], ["D", true], ["E", true],
  ];
  const history = outcomes.map(([title, betterThanPrevious], i) => ({
    order: i + 1,
    title,
    dateWatched: "2024-01-01",
    betterThanPrevious,
  }));

  const first = await calculateLogisticRatingsWithBackend(tf, history);
  const second = await calculateLogisticRatingsWithBackend(tf, history);

  // Guard against the error path, which returns {} (and {} equals {}).
  assert.equal(Object.keys(first).length, 6);
  assert.ok(first.E > first.F, "the film with the best record should outscore the worst");
  assert.ok(first.E > first.A, "the film with the best record should outscore the worst");
  assert.deepEqual(second, first);
});

const maxAbsDifference = (
  a: Record<string, number>,
  b: Record<string, number>
) => Math.max(...Object.keys(a).map((title) => Math.abs(a[title] - b[title])));

test("scores settle instead of growing with more training", async () => {
  // No contradictions here, so without regularization the weights would keep
  // growing for as long as training runs.
  const outcomes: [string, boolean | null][] = [
    ["A", null], ["B", true], ["C", false], ["D", true], ["A", false],
    ["E", true], ["B", false], ["F", false], ["D", true], ["E", true],
  ];
  const history = outcomes.map(([title, betterThanPrevious], i) => ({
    order: i + 1,
    title,
    dateWatched: "2024-01-01",
    betterThanPrevious,
  }));

  const normal = await calculateLogisticRatingsWithBackend(tf, history);
  const fourTimesLonger = await calculateLogisticRatingsWithBackend(
    tf,
    history,
    { epochs: 2000 }
  );

  assert.equal(Object.keys(normal).length, 6);
  assert.ok(
    maxAbsDifference(normal, fourTimesLonger) < 1e-4,
    `scores moved by ${maxAbsDifference(normal, fourTimesLonger)} with more training`
  );
});

test("the same comparisons give the same scores in any order", async () => {
  // 40 comparisons among 12 films, each written as its own two-entry segment
  // (the null entry breaks the chain), so the segments can be reordered
  // without changing which films were compared or who won.
  const segments: [string, boolean | null][][] = [];
  for (let k = 0; k < 40; k++) {
    const a = k % 12;
    const b = (k * 5 + 3) % 12;
    segments.push([
      [`F${a}`, null],
      [`F${b}`, b < a],
    ]);
  }
  const toHistory = (segs: [string, boolean | null][][]) =>
    segs.flat().map(([title, betterThanPrevious], i) => ({
      order: i + 1,
      title,
      dateWatched: "2024-01-01",
      betterThanPrevious,
    }));

  const forward = await calculateLogisticRatingsWithBackend(
    tf,
    toHistory(segments)
  );
  const reversed = await calculateLogisticRatingsWithBackend(
    tf,
    toHistory([...segments].reverse())
  );

  assert.equal(Object.keys(forward).length, 12);
  assert.ok(
    maxAbsDifference(forward, reversed) < 1e-4,
    `scores differ by ${maxAbsDifference(forward, reversed)} between orderings`
  );
});

async function main() {
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS  ${name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL  ${name}`);
      console.error(err instanceof Error ? err.message : err);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${tests.length} tests passed`);
}

main();
