"use server";

import { refresh } from "next/cache";
import { applyAnswer, undoLastAnswer, type Answer } from "@/utils/watchQueue";
import { readReviewState, writeReviewState } from "@/utils/watchStore";

const ANSWERS: readonly Answer[] = ["better", "worse", "skip", "dismiss"];

/**
 * The review page edits files in the repository, so it only works when the
 * site runs locally under `next dev`. A deployed build refuses every call.
 */
function assertDevelopment() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Reviewing watches only works in local development.");
  }
}

export async function answerWatch(formData: FormData) {
  assertDevelopment();

  const plexKey = String(formData.get("plexKey") ?? "");
  const answer = String(formData.get("answer") ?? "") as Answer;
  if (!ANSWERS.includes(answer)) throw new Error(`Unknown answer "${answer}".`);
  const title = formData.get("title");

  const root = process.cwd();
  const before = readReviewState(root);
  const after = applyAnswer(
    before,
    plexKey,
    answer,
    typeof title === "string" ? title : undefined
  );
  writeReviewState(root, before, after);
  refresh();
}

export async function undoAnswer() {
  assertDevelopment();

  const root = process.cwd();
  const before = readReviewState(root);
  writeReviewState(root, before, undoLastAnswer(before));
  refresh();
}
