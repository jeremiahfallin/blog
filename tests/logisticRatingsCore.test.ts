import assert from "node:assert/strict";
import { buildComparisonData } from "../src/utils/logisticRatingsCore";

const normalizeZeros = (arr: number[]) => arr.map((v) => v + 0);

type Test = { name: string; fn: () => void };
const tests: Test[] = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });

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

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
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
