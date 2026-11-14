import assert from "node:assert/strict";
import { calculateRatings } from "../src/utils/calculateRatings";

type TestFn = () => void | Promise<void>;
type Test = { name: string; fn: TestFn };
const tests: Test[] = [];
const test = (name: string, fn: TestFn) => tests.push({ name, fn });

type Row = [title: string, betterThanPrevious: boolean | null];

// Every entry shares one date, so temporal decay leaves all weights at 1.
const toHistory = (rows: Row[]) =>
  rows.map(([title, betterThanPrevious], i) => ({
    order: i + 1,
    title,
    dateWatched: "2024-01-01",
    betterThanPrevious,
  }));

/** `winner` beat `loser` once, as a standalone two-entry segment. */
const win = (winner: string, loser: string): Row[] => [
  [loser, null],
  [winner, true],
];

/** `count` standalone comparisons between a and b, of which a wins `aWins`. */
const record = (a: string, b: string, aWins: number, count: number): Row[] =>
  Array.from({ length: count }, (_, k) =>
    k < aWins ? win(a, b) : win(b, a)
  ).flat();

test("a 30-10 record gives a strength ratio just under 3", () => {
  const { ratings } = calculateRatings(toHistory(record("A", "B", 30, 40)));

  // The unregularized Bradley-Terry answer is exactly 3; a weak prior may
  // pull it slightly toward even but must never push it past 3.
  const ratio = ratings.A / ratings.B;
  assert.ok(ratio > 2.7 && ratio < 3, `ratio was ${ratio}`);
});

test("the prior pulls a 3-1 record toward even", () => {
  const { ratings } = calculateRatings(toHistory(record("A", "B", 3, 4)));

  const ratio = ratings.A / ratings.B;
  assert.ok(ratio > 1.5 && ratio < 3, `ratio was ${ratio}`);
});

/**
 * Independent solve of the objective the engine claims to maximize, in
 * log-strength space with Newton's method:
 *
 *   Σ comparisons log σ(θ_winner − θ_loser)  +  Σ films [log σ(θ) + log σ(−θ)]
 *
 * The second sum is the prior: every film plays two virtual games against a
 * reference film of strength 1 (θ = 0), winning one and losing one.
 */
function referenceLogStrengths(titles: string[], comparisons: [string, string][]) {
  const index = new Map(titles.map((t, i) => [t, i]));
  const n = titles.length;
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  let theta = new Array<number>(n).fill(0);

  for (let iteration = 0; iteration < 100; iteration++) {
    const gradient = theta.map((t) => 1 - 2 * sigmoid(t));
    const hessian = theta.map((t, i) => {
      const row = new Array<number>(n).fill(0);
      row[i] = -2 * sigmoid(t) * (1 - sigmoid(t));
      return row;
    });
    for (const [winner, loser] of comparisons) {
      const w = index.get(winner)!;
      const l = index.get(loser)!;
      const p = sigmoid(theta[w] - theta[l]);
      gradient[w] += 1 - p;
      gradient[l] -= 1 - p;
      const h = p * (1 - p);
      hessian[w][w] -= h;
      hessian[l][l] -= h;
      hessian[w][l] += h;
      hessian[l][w] += h;
    }
    const step = solveLinear(hessian, gradient);
    theta = theta.map((t, i) => t - step[i]);
    if (Math.max(...step.map(Math.abs)) < 1e-13) break;
  }
  return theta;
}

function solveLinear(matrix: number[][], rhs: number[]) {
  const n = rhs.length;
  const m = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = col + 1; r < n; r++) {
      const factor = m[r][col] / m[col][col];
      for (let k = col; k <= n; k++) m[r][k] -= factor * m[col][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let value = m[r][n];
    for (let k = r + 1; k < n; k++) value -= m[r][k] * x[k];
    x[r] = value / m[r][r];
  }
  return x;
}

test("ratings match an independent Newton solve of the same model", () => {
  // Deliberately full of chains (A beat B, B beat C, C beat D), a loop
  // (E > F > G > E) and a split record (X/Y): only the comparisons that were
  // actually made may count as evidence, each exactly once.
  const comparisons: [string, string][] = [
    ["A", "B"], ["B", "C"], ["C", "D"], ["A", "D"],
    ["E", "F"], ["F", "G"], ["G", "E"], ["D", "E"],
    ["X", "Y"], ["X", "Y"], ["X", "Y"], ["Y", "X"], ["C", "X"],
  ];
  const history = toHistory(comparisons.flatMap(([w, l]) => win(w, l)));

  const { ratings } = calculateRatings(history);
  const titles = Object.keys(ratings);
  const theta = referenceLogStrengths(titles, comparisons);

  assert.equal(titles.length, 9);
  // Ratings are shares of a total, so only their ratios are comparable:
  // log(r_i / r_0) should equal θ_i − θ_0 for every film.
  titles.forEach((title, i) => {
    const fitted = Math.log(ratings[title] / ratings[titles[0]]);
    const expected = theta[i] - theta[0];
    assert.ok(
      Math.abs(fitted - expected) < 1e-6,
      `${title}: fitted log-ratio ${fitted}, expected ${expected}`
    );
  });
});

test("the same comparisons give the same ratings in any order", () => {
  // 40 comparisons among 12 films, each its own two-entry segment so the
  // segments can be reordered without changing who was compared or who won.
  const segments: Row[][] = [];
  for (let k = 0; k < 40; k++) {
    const a = k % 12;
    const b = (k * 5 + 3) % 12;
    if (a === b) continue;
    segments.push(b < a ? win(`F${b}`, `F${a}`) : win(`F${a}`, `F${b}`));
  }

  const forward = calculateRatings(toHistory(segments.flat())).ratings;
  const reversed = calculateRatings(
    toHistory([...segments].reverse().flat())
  ).ratings;

  assert.equal(Object.keys(forward).length, 12);
  for (const title of Object.keys(forward)) {
    assert.ok(
      Math.abs(forward[title] / reversed[title] - 1) < 1e-9,
      `${title}: ${forward[title]} forward vs ${reversed[title]} reversed`
    );
  }
});

test("ratings are shares that sum to 1", () => {
  const { ratings } = calculateRatings(toHistory(record("A", "B", 3, 4)));

  const total = Object.values(ratings).reduce((sum, r) => sum + r, 0);
  assert.ok(Math.abs(total - 1) < 1e-12, `total was ${total}`);
});

test("films with the same evidence get the same uncertainty whatever their score", () => {
  // Z is a bystander (never compared) so the field has more than two films;
  // with exactly two, shares are mirror images and hide a score dependence.
  const { ratings, uncertainties } = calculateRatings(
    toHistory([["Z", null], ...win("A", "B")])
  );

  assert.ok(ratings.A > ratings.B);
  assert.ok(
    Math.abs(uncertainties.A - uncertainties.B) < 1e-9,
    `A ${uncertainties.A} vs B ${uncertainties.B}`
  );
});

test("uncertainty is the log-strength standard deviation implied by the evidence", () => {
  // C and D split ten comparisons evenly, so each comparison contributes
  // curvature 1/4 and the prior's two virtual games contribute 1/2:
  // sd = 1 / sqrt(10/4 + 1/2).
  const { uncertainties } = calculateRatings(
    toHistory(record("C", "D", 5, 10))
  );

  const expected = 1 / Math.sqrt(10 / 4 + 1 / 2);
  assert.ok(
    Math.abs(uncertainties.C - expected) < 1e-6,
    `C was ${uncertainties.C}, expected ${expected}`
  );
});

test("a film with no comparisons keeps the prior's uncertainty", () => {
  // Z is followed by a null entry, so it is never compared with anything.
  const { uncertainties } = calculateRatings(
    toHistory([["Z", null], ...win("A", "B")])
  );

  // Two virtual 50/50 games: curvature 1/2, sd = sqrt(2).
  assert.ok(
    Math.abs(uncertainties.Z - Math.SQRT2) < 1e-6,
    `Z was ${uncertainties.Z}`
  );
  assert.ok(uncertainties.Z > uncertainties.A);
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
