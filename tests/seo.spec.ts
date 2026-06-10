import { test, expect } from "@playwright/test";

test.describe("SEO", () => {
  test("movie detail pages have their own title and Open Graph tags", async ({
    page,
  }) => {
    await page.goto("/movies/the-platform");

    await expect(page).toHaveTitle("The Platform | Jeremiah Fallin");

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /The Platform/);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute("content", "article");
  });

  test("listing pages have their own titles", async ({ page }) => {
    await page.goto("/movies");
    await expect(page).toHaveTitle("Movies | Jeremiah Fallin");

    await page.goto("/projects");
    await expect(page).toHaveTitle("Projects | Jeremiah Fallin");

    await page.goto("/shows");
    await expect(page).toHaveTitle("TV Shows | Jeremiah Fallin");
  });

  test("sitemap.xml lists static pages and posts", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/about");
    expect(body).toContain("/movies/the-platform");
  });

  test("robots.txt points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Sitemap:");
  });

  test("RSS feed is served with valid items", async ({ request }) => {
    const response = await request.get("/feed.xml");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain(
      "application/rss+xml"
    );

    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<item>");
    expect(body).toContain("The Platform");
  });
});
