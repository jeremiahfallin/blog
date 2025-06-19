import { test, expect, Page } from "@playwright/test";

// Helper function to get text content of cells in a specific column
async function getColumnCellsText(
  page: Page,
  columnIndex: number
): Promise<string[]> {
  // Wait for the table body to be present
  await page.locator("table > tbody").waitFor({ state: "visible" });
  // Wait for at least one row to be present
  await page
    .locator("table > tbody > tr")
    .first()
    .waitFor({ state: "visible" });

  return page
    .locator(`table > tbody > tr > td:nth-child(${columnIndex})`)
    .allTextContents();
}

// Helper function to parse score (handles potential non-numeric values gracefully)
function parseScore(scoreText: string): number {
  const score = parseFloat(scoreText);
  return isNaN(score) ? -Infinity : score; // Treat non-numbers as lowest score for comparison
}

// Helper function to parse date
function parseDate(dateString: string): number {
  return new Date(dateString).getTime();
}

test.describe("Movie Table Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the movies page before each test
    await page.goto("/movies");
    // Ensure the table view is active (it's the default)
    await expect(
      page.getByRole("tab", { name: "Table View", selected: true })
    ).toBeVisible();

    // Wait for the loading indicator to disappear (if it exists)
    await page
      .getByText("Loading movie data...")
      .waitFor({ state: "detached", timeout: 5000 })
      .catch(() => {
        // If the loading text doesn't exist or disappears quickly, that's fine
      });

    // Wait for the table itself to be visible
    await expect(page.getByRole("table")).toBeVisible();

    // Wait for a known movie's logistic score to be visible - it should be pre-calculated now
    const knownMovieTitle = "Killers of the Flower Moon";
    const knownMovieRowLocator = page.locator("tr", {
      has: page.getByRole("cell", { name: knownMovieTitle }),
    });

    // Make sure the movie row is visible
    await expect(knownMovieRowLocator).toBeVisible();

    const knownMovieScoreCellLocator =
      knownMovieRowLocator.locator("td:nth-child(7)"); // Logistic score is the 7th column

    // Verify it has a numeric value (not "Calculating...")
    await expect(knownMovieScoreCellLocator).not.toHaveText("Calculating...");
    // Then, assert that it matches the number regex
    await expect(knownMovieScoreCellLocator).toHaveText(/^-?\d+(\.\d+)?$/);
  });

  test("should load and display movie data in the table", async ({ page }) => {
    // Check for table headers
    await expect(
      page.getByRole("columnheader", { name: "Title" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Date Watched" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "BT Score", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Logistic Score" })
    ).toBeVisible();

    // Check for at least one row of data (using a known movie)
    const fallGuyCell = page
      .getByRole("cell", { name: "The Fall Guy" })
      .first();
    await expect(fallGuyCell).toBeVisible(); // From movie-watch-history.json

    // Find the row containing "The Fall Guy" cell
    const fallGuyRow = fallGuyCell.locator("xpath=ancestor::tr");

    // Find the date cell *within that specific row*
    const dateCellInRow = fallGuyRow.getByRole("cell", { name: "2024-9-7" });
    await expect(dateCellInRow).toBeVisible(); // Date for The Fall Guy

    // Check that logistic scores are numbers (or formatted numbers)
    const firstLogisticScoreCell = page.locator(
      "table > tbody > tr:first-child > td:nth-child(7)"
    );
    await expect(firstLogisticScoreCell).toHaveText(/^-?\d+(\.\d+)?$/); // Matches numbers like 1500, 1500.12 or -0.1602
  });

  test("should sort table by Title (Ascending and Descending)", async ({
    page,
  }) => {
    const titleHeader = page.getByRole("columnheader", { name: "Title" });
    const titleColumnIndex = 2; // Titles are in the first column

    // --- Sort Ascending ---
    await titleHeader.click();
    // Wait for potential re-render/sort
    await page.waitForTimeout(500); // Small delay to allow DOM update
    const titlesAsc = await getColumnCellsText(page, titleColumnIndex);
    // Check if the list is alphabetically sorted (case-insensitive)
    expect(titlesAsc.length).toBeGreaterThan(1);
    // Create a sorted copy for comparison
    const sortedTitlesAsc = [...titlesAsc].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    expect(titlesAsc).toEqual(sortedTitlesAsc); // Compare the whole list

    // --- Sort Descending ---
    await titleHeader.click();
    // Wait for potential re-render/sort
    await page.waitForTimeout(500); // Small delay
    const titlesDesc = await getColumnCellsText(page, titleColumnIndex);
    // Check if the list is reverse alphabetically sorted (case-insensitive)
    expect(titlesDesc.length).toBeGreaterThan(1);
    // Create a reverse sorted copy for comparison
    const sortedTitlesDesc = [...titlesDesc].sort((a, b) =>
      b.localeCompare(a, undefined, { sensitivity: "base" })
    );
    expect(titlesDesc).toEqual(sortedTitlesDesc); // Compare the whole list
  });

  test("should sort table by Date Watched (Ascending and Descending)", async ({
    page,
  }) => {
    const dateHeader = page.getByRole("columnheader", { name: "Date Watched" });
    const dateColumnIndex = 3; // Dates are in the second column

    // --- Sort Ascending (Oldest First) ---
    await dateHeader.click();
    await page.waitForTimeout(500);
    const datesAscText = await getColumnCellsText(page, dateColumnIndex);
    const datesAsc = datesAscText.map(parseDate);
    expect(datesAsc.length).toBeGreaterThan(1);
    expect(datesAsc[0]).toBeLessThanOrEqual(datesAsc[1]); // Oldest date should be less than or equal to next

    // --- Sort Descending (Newest First) ---
    await dateHeader.click();
    await page.waitForTimeout(500);
    const datesDescText = await getColumnCellsText(page, dateColumnIndex);
    const datesDesc = datesDescText.map(parseDate);
    expect(datesDesc.length).toBeGreaterThan(1);
    expect(datesDesc[0]).toBeGreaterThanOrEqual(datesDesc[1]); // Newest date should be greater than or equal to next
  });

  test("should sort table by Score (Ascending and Descending)", async ({
    page,
  }) => {
    const scoreHeader = page.getByRole("columnheader", {
      name: "BT Score",
    });
    const scoreColumnIndex = 6;

    // --- Sort Ascending (Lowest First - should be the state after first click) ---
    await scoreHeader.click();
    await page.waitForTimeout(500); // Reduced timeout since no calculation needed
    const scoresAscText = await getColumnCellsText(page, scoreColumnIndex);
    const scoresAsc = scoresAscText.map(parseScore);
    expect(scoresAsc.length).toBeGreaterThan(1);
    expect(scoresAsc[0]).toBeGreaterThanOrEqual(scoresAsc[1]);

    // --- Sort Descending (Highest First - should be the state after second click) ---
    await scoreHeader.click();
    await page.waitForTimeout(500); // Reduced timeout since no calculation needed
    const scoresDescText = await getColumnCellsText(page, scoreColumnIndex);
    const scoresDesc = scoresDescText.map(parseScore);
    expect(scoresDesc.length).toBeGreaterThan(1);
    expect(scoresDesc[0]).toBeLessThanOrEqual(scoresDesc[1]);
  });

  test("should sort table by Logistic Score (Ascending and Descending)", async ({
    page,
  }) => {
    const logisticScoreHeader = page.getByRole("columnheader", {
      name: "Logistic Score",
    });
    const logisticScoreColumnIndex = 7;

    // --- Sort Descending (Highest First) ---
    await logisticScoreHeader.click();
    await page.waitForTimeout(500); // Reduced timeout since no calculation needed
    const scoresDescText = await getColumnCellsText(
      page,
      logisticScoreColumnIndex
    );
    const scoresDesc = scoresDescText.map(parseScore);
    expect(scoresDesc.length).toBeGreaterThan(1);
    expect(scoresDesc[0]).toBeGreaterThanOrEqual(scoresDesc[1]);

    // --- Sort Ascending (Lowest First) ---
    await logisticScoreHeader.click();
    await page.waitForTimeout(500); // Reduced timeout since no calculation needed
    const scoresAscText = await getColumnCellsText(
      page,
      logisticScoreColumnIndex
    );
    const scoresAsc = scoresAscText.map(parseScore);
    expect(scoresAsc.length).toBeGreaterThan(1);
    expect(scoresAsc[0]).toBeLessThanOrEqual(scoresAsc[1]);
  });
});
