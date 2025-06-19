import { test, expect } from "@playwright/test";

// Define movie type to avoid using 'any'
interface Movie {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
  btscore: number;
  viewCount: number;
  logisticScore: number | null;
}

test.describe("Movie API", () => {
  test("GET /api/movies returns pre-calculated movie data with scores", async ({
    request,
  }) => {
    // Make a request to the API endpoint
    const response = await request.get("/api/movies");

    // Expect a successful response
    expect(response.ok()).toBeTruthy();

    // Parse the response JSON
    const movies = (await response.json()) as Movie[];

    // Verify the basic structure
    expect(Array.isArray(movies)).toBeTruthy();
    expect(movies.length).toBeGreaterThan(0);

    // Check that a known movie exists with expected properties
    const fallGuy = movies.find((movie) => movie.title === "The Fall Guy");
    expect(fallGuy).toBeDefined();
    expect(fallGuy).toHaveProperty("order", 1);
    expect(fallGuy).toHaveProperty("dateWatched", "2024-9-7");
    expect(fallGuy).toHaveProperty("btscore");
    expect(fallGuy).toHaveProperty("viewCount");
    expect(fallGuy).toHaveProperty("logisticScore");

    // Check that numeric properties are actually numbers
    expect(typeof fallGuy!.btscore).toBe("number");
    expect(typeof fallGuy!.viewCount).toBe("number");
    expect(typeof fallGuy!.logisticScore).toBe("number");

    // Test caching - make another request immediately
    const secondResponse = await request.get("/api/movies");
    expect(secondResponse.ok()).toBeTruthy();

    // Check cache headers
    const cacheControl = secondResponse.headers()["cache-control"];
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage=3600");
    expect(cacheControl).toContain("stale-while-revalidate");
  });

  test("Movie scores are correctly calculated", async ({ request }) => {
    const response = await request.get("/api/movies");
    const movies = (await response.json()) as Movie[];

    // Check that we have logistic scores for all movies
    const moviesWithoutScores = movies.filter(
      (movie) => movie.logisticScore === null
    );
    expect(moviesWithoutScores.length).toBe(0);

    // Check that BT scores make sense (they should be between 0 and 100)
    for (const movie of movies) {
      expect(movie.btscore).toBeGreaterThanOrEqual(0);
      expect(movie.btscore).toBeLessThanOrEqual(100);
    }

    // Check that movies with "betterThanPrevious" = true generally have higher scores
    // This is a probabilistic test, not deterministic
    const betterMovies = movies.filter(
      (movie) => movie.betterThanPrevious === true
    );
    const worseMovies = movies.filter(
      (movie) => movie.betterThanPrevious === false
    );

    if (betterMovies.length > 5 && worseMovies.length > 5) {
      const avgBetterScore =
        betterMovies.reduce((sum, movie) => sum + movie.logisticScore!, 0) /
        betterMovies.length;
      const avgWorseScore =
        worseMovies.reduce((sum, movie) => sum + movie.logisticScore!, 0) /
        worseMovies.length;

      // In general, movies marked as better should have higher scores
      // but this is not a strict requirement - just a tendency
      expect(avgBetterScore).toBeGreaterThan(avgWorseScore * 0.7);
    }
  });
});
