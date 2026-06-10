import fs from "fs/promises";
import path from "path";

const WORDS_PER_MINUTE = 200;

/**
 * Estimate reading time in minutes for an MDX entry by reading its raw source,
 * stripping the metadata export, and counting words.
 *
 * Returns at least 1 minute.
 */
export async function getReadingTime(
  section: "movies" | "shows" | "projects",
  slug: string
): Promise<number> {
  try {
    const filePath = path.join(process.cwd(), "src", "content", section, `${slug}.mdx`);
    const content = await fs.readFile(filePath, "utf-8");
    // Strip the `export const metadata = { ... };` block
    const stripped = content.replace(/export const metadata\s*=\s*\{[\s\S]*?\};\s*/m, "").trim();
    const words = stripped.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  } catch {
    return 1;
  }
}
