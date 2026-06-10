import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to the Movies page", async ({ page }) => {
    // Start from the index page (the baseURL is set via the config)
    await page.goto("/");

    // Find the link with text "Movies" and click it
    await page.getByRole("link", { name: "Movies", exact: true }).click();

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
    await page.getByRole("link", { name: "Projects", exact: true }).click();

    // The new URL should be "/projects"
    await expect(page).toHaveURL("/projects");

    // The new page should contain an h1 with "Projects"
    await expect(
      page.getByRole("heading", { name: "Projects", level: 1 })
    ).toBeVisible();
  });

  test("should navigate to the Shows page", async ({ page }) => {
    // Start from the index page
    await page.goto("/");

    // Find the link with text "Shows" and click it
    await page.getByRole("link", { name: "Shows", exact: true }).click();

    // The new URL should be "/shows"
    await expect(page).toHaveURL("/shows");

    // The new page should contain an h1 with "TV Shows"
    await expect(
      page.getByRole("heading", { name: "TV Shows", level: 1 })
    ).toBeVisible();
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
      page.getByRole("heading", { name: "Featured Projects", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent Watch History", level: 2 })
    ).toBeVisible();
  });
});
