import assert from "node:assert/strict";
import { scoreRewatchPairs } from "../src/utils/rewatchSuggestions";

type TestFn = () => void | Promise<void>;
type Test = { name: string; fn: TestFn };
const tests: Test[] = [];
const test = (name: string, fn: TestFn) => tests.push({ name, fn });

const film = (title: string, rating: number, uncertainty: number) => ({
  title,
  rating,
  uncertainty,
});

const link = (source: string, target: string) => ({ source, target });

const gainOf = (
  pairs: ReturnType<typeof scoreRewatchPairs>,
  x: string,
  y: string
) => {
  const pair = pairs.find(
    (p) =>
      (p.a.title === x && p.b.title === y) ||
      (p.a.title === y && p.b.title === x)
  );
  assert.ok(pair, `no pair scored for ${x} / ${y}`);
  return pair.gain;
};

test("a pair's gain does not depend on how highly the two films are rated", () => {
  const pairs = scoreRewatchPairs(
    [
      film("Top1", 0.4, 1),
      film("Top2", 0.4, 1),
      film("Low1", 0.01, 1),
      film("Low2", 0.01, 1),
    ],
    []
  );

  assert.ok(
    Math.abs(gainOf(pairs, "Top1", "Top2") - gainOf(pairs, "Low1", "Low2")) <
      1e-12
  );
});

test("prefers the pair whose scores are least pinned down", () => {
  const pairs = scoreRewatchPairs(
    [
      film("Vague1", 0.25, 1.4),
      film("Vague2", 0.25, 1.4),
      film("Settled1", 0.25, 0.5),
      film("Settled2", 0.25, 0.5),
    ],
    []
  );

  assert.deepEqual(
    [pairs[0].a.title, pairs[0].b.title].sort(),
    ["Vague1", "Vague2"]
  );
  assert.ok(
    gainOf(pairs, "Vague1", "Vague2") > gainOf(pairs, "Settled1", "Settled2")
  );
});

test("prefers a toss-up over a foregone conclusion", () => {
  const pairs = scoreRewatchPairs(
    [film("Even1", 0.2, 1), film("Even2", 0.2, 1), film("Weak", 0.02, 1)],
    []
  );

  assert.ok(gainOf(pairs, "Even1", "Even2") > gainOf(pairs, "Even1", "Weak"));
});

test("skips pairs that have already been compared directly", () => {
  const pairs = scoreRewatchPairs(
    [film("A", 0.5, 1), film("B", 0.3, 1), film("C", 0.2, 1)],
    [link("B", "A")]
  );

  const titles = pairs.map((p) => [p.a.title, p.b.title].sort().join("/"));
  assert.deepEqual(titles.sort(), ["A/C", "B/C"]);
});

test("gain is the expected information of the comparison in nats", () => {
  // A and B are linked through C, so they share a component (no bridge
  // bonus) but have not been compared. p = 0.5 and each score has variance
  // 1, so gain = 0.5 * ln(1 + 0.25 * (1 + 1)).
  const pairs = scoreRewatchPairs(
    [film("A", 0.3, 1), film("B", 0.3, 1), film("C", 0.4, 1)],
    [link("A", "C"), link("C", "B")]
  );

  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].bridged, false);
  assert.ok(Math.abs(pairs[0].p - 0.5) < 1e-12);
  assert.ok(Math.abs(pairs[0].gain - 0.5 * Math.log(1.5)) < 1e-12);
});

test("a pair that joins two separate comparison graphs gets the bridge bonus", () => {
  const films = [
    film("A", 0.25, 1),
    film("B", 0.25, 1),
    film("C", 0.25, 1),
    film("D", 0.25, 1),
    film("E", 0.25, 1),
  ];
  // A-C-B form one component; D-E another.
  const pairs = scoreRewatchPairs(
    films,
    [link("A", "C"), link("C", "B"), link("D", "E")],
    { bridgeBonus: 4 }
  );

  const inside = gainOf(pairs, "A", "B");
  const across = gainOf(pairs, "A", "D");
  assert.ok(Math.abs(across - 4 * inside) < 1e-12);
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
