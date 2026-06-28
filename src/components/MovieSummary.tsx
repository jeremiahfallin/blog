"use client";

import { useMemo } from "react";
import { Box, Text } from "@radix-ui/themes";
import type { MovieRating } from "@/types/ratings";

function formatMonthYear(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function MovieSummary({
  movies,
  cycles,
}: {
  movies: MovieRating[];
  cycles: string[][];
}) {
  const stats = useMemo(() => {
    const uniqueTitles = new Set(movies.map((m) => m.title)).size;

    const dates = movies
      .map((m) => m.dateWatched)
      .filter(Boolean)
      .sort();
    const span =
      dates.length > 0
        ? `${formatMonthYear(dates[0])} – ${formatMonthYear(
            dates[dates.length - 1]
          )}`
        : "—";

    const topRated = movies.reduce<MovieRating | null>(
      (best, m) => (best === null || m.btscore > best.btscore ? m : best),
      null
    );

    return {
      uniqueTitles,
      views: movies.length,
      span,
      topRated,
      cycles: cycles.length,
    };
  }, [movies, cycles]);

  const cards = [
    {
      label: "Films watched",
      value: String(stats.uniqueTitles),
      sub: `${stats.views} views`,
    },
    {
      label: "Watching since",
      value: stats.span,
      sub: null,
    },
    {
      label: "Top rated",
      value: stats.topRated?.title ?? "—",
      sub: stats.topRated ? `BT ${stats.topRated.btscore.toFixed(2)}` : null,
    },
    {
      label: "Preference cycles",
      value: String(stats.cycles),
      sub: stats.cycles === 1 ? "contradiction" : "contradictions",
    },
  ];

  return (
    <Box className="movie-summary" role="list" aria-label="Watch history summary">
      {cards.map((card) => (
        <Box key={card.label} className="stat-card" role="listitem">
          <Text as="div" className="stat-label">
            {card.label}
          </Text>
          <Text as="div" className="stat-value">
            {card.value}
          </Text>
          {card.sub && (
            <Text as="div" className="stat-sub">
              {card.sub}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}
