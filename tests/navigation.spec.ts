import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to the Movies page", async ({ page }) => {
    // Start from the index page (the baseURL is set via the config)
    await page.goto("/");

    // Find the link with text "Movies" and click it
    await page.getByRole("link", { name: "Movies" }).click();

    // The new URL should be "/movies" (baseURL is prepended automatically)
    await expect(page).toHaveURL("/movies");

    // The new page should contain an h1 with "Movie Watch History"
    await expect(
      page.getByRole("heading", { name: "Movie Watch History", level: 1 })
    ).toBeVisible();
  });

  test("should navigate to the Projects page", async ({ page }) => {
    // Start from the index page
    await page.goto("/");

    // Find the link with text "Projects" and click it
    await page.getByRole("link", { name: "Projects" }).click();

    // The new URL should be "/projects"
    await expect(page).toHaveURL("/projects");

    // The new page should contain an h1 with "Projects" (Update if your heading is different)
    // Assuming you'll add a /projects page later, let's check for the link text for now
    // If you have a specific heading on the projects page, use that instead.
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible(); // Placeholder check
    // TODO: Add a more specific check once the /projects page exists or has content
  });

  test("should navigate back to the Home page", async ({ page }) => {
    // Start from the movies page
    await page.goto("/movies");

    // Find the link with text "Jeremiah Fallin" (your home link) and click it
    await page.getByRole("link", { name: "Jeremiah Fallin" }).click();

    // The new URL should be the root "/"
    await expect(page).toHaveURL("/");

    // Check for a heading specific to the home page
    await expect(
      page.getByRole("heading", { name: "Projects", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Movies", level: 2 })
    ).toBeVisible();
  });
});
