"use client";
import { useState, useMemo, type ReactNode } from "react";
import {
  Box,
  Button,
  Flex,
  Link,
  Table,
  TextField,
  Card,
  Heading,
  HoverCard,
  Text,
  Badge,
} from "@radix-ui/themes";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import NextLink from "next/link";
import Image from "next/image";
import { BlogPostData } from "@/getBlogPosts";
import type { MovieRating, PosterMap } from "@/types/ratings";

const columnHelper = createColumnHelper<MovieRating>();

function ScoreHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <HoverCard.Root openDelay={120} closeDelay={80}>
      <HoverCard.Trigger>
        <span
          tabIndex={0}
          style={{
            borderBottom: "1px dotted var(--gray-8)",
            cursor: "help",
          }}
        >
          {title}
        </span>
      </HoverCard.Trigger>
      <HoverCard.Content size="2" style={{ maxWidth: "320px" }}>
        <Box>{children}</Box>
      </HoverCard.Content>
    </HoverCard.Root>
  );
}

const columns = [
  columnHelper.accessor("order", {
    header: "Order",
    cell: (props) => (
      <Text size="2" color="gray" style={{ opacity: 0.8 }}>
        #{props.getValue()}
      </Text>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Title",
    sortingFn: (rowA, rowB) => {
      const valA = rowA.original.title;
      const valB = rowB.original.title;
      return valA.localeCompare(valB, undefined, { sensitivity: "base" });
    },
    cell: (props) => props.getValue(),
  }),
  columnHelper.accessor("dateWatched", {
    header: "Date Watched",
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.dateWatched);
      const dateB = new Date(rowB.original.dateWatched);
      return dateA.getTime() - dateB.getTime();
    },
    cell: (props) => props.getValue(),
  }),
  columnHelper.accessor("betterThanPrevious", {
    header: "Better Than Previous",
    cell: (props) => {
      const value = props.getValue();
      if (value === null) {
        return (
          <Badge color="gray" variant="outline" radius="full" title="First watch in history — no previous to compare">
            —
          </Badge>
        );
      }
      return value ? (
        <Badge color="green" variant="soft" radius="full" title="Rated better than the previously-watched movie at the time of viewing">
          Yes
        </Badge>
      ) : (
        <Badge color="gray" variant="soft" radius="full" title="Rated worse than the previously-watched movie at the time of viewing">
          No
        </Badge>
      );
    },
  }),
  columnHelper.accessor("viewCount", {
    header: "View Count",
    cell: (props) => {
      const count = props.getValue();
      return (
        <Badge color="blue" variant="soft" radius="full" style={{ fontWeight: 600 }}>
          {count} {count === 1 ? "view" : "views"}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("btscore", {
    header: () => (
      <ScoreHeader title="BT Score">
        <Text size="2" style={{ lineHeight: 1.6 }}>
          <strong style={{ color: "var(--blue-11)" }}>Bradley-Terry probability rating</strong> inferred from
          pairwise comparisons across the watch history, with temporal decay weighting more recent reviews.
          The <em>±</em> value is a Bayesian uncertainty estimate from a diagonal Laplace approximation.
          Higher is more preferred.
        </Text>
      </ScoreHeader>
    ),
    cell: (props) => {
      const score = props.getValue();
      const uncertainty = props.row.original.bayesianUncertainty;
      return (
        <Flex direction="column" gap="0">
          <Text weight="bold" size="2" style={{ color: "var(--blue-11)" }}>
            {score.toFixed(2)}
          </Text>
          {uncertainty !== undefined && (
            <Text size="1" color="gray" style={{ opacity: 0.8 }}>
              ±{(100 * uncertainty).toFixed(2)}
            </Text>
          )}
        </Flex>
      );
    },
  }),
  columnHelper.accessor("logisticScore", {
    header: () => (
      <ScoreHeader title="Logistic Score">
        <Text size="2" style={{ lineHeight: 1.6 }}>
          An independent <strong style={{ color: "var(--indigo-11)" }}>TensorFlow.js logistic-regression</strong>{" "}
          model trained on the same pairwise comparisons. Positive values mean preferred; negative values mean
          less preferred.
        </Text>
      </ScoreHeader>
    ),
    cell: (props) => {
      const score = props.getValue();
      if (score === null) {
        return <Text size="2" color="gray">Calculating...</Text>;
      }
      const isPositive = score >= 0;
      return (
        <Badge color={isPositive ? "indigo" : "amber"} variant="surface" radius="medium" style={{ fontFamily: "monospace" }}>
          {score.toFixed(4)}
        </Badge>
      );
    },
  }),
];

export default function MovieTable({
  posts,
  movies,
  cycles,
  posters,
}: {
  posts: BlogPostData[];
  movies: MovieRating[];
  cycles: string[][];
  posters: PosterMap;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Determine unique movies based on sorting criteria
  const uniqueMovies = useMemo(() => {
    let filtered = movies;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = movies.filter((movie) =>
        movie.title.toLowerCase().includes(query)
      );
    }

    if (
      sorting.length > 0 &&
      (sorting[0].id === "btscore" ||
        sorting[0].id === "viewCount" ||
        sorting[0].id === "logisticScore")
    ) {
      const movieMap = new Map<string, MovieRating>();

      filtered.forEach((movie) => {
        const existingMovie = movieMap.get(movie.title);
        if (
          !existingMovie ||
          (sorting[0].id === "btscore" &&
            existingMovie.btscore < movie.btscore) ||
          (sorting[0].id === "viewCount" &&
            existingMovie.viewCount < movie.viewCount) ||
          (sorting[0].id === "logisticScore" &&
            movie.logisticScore !== null &&
            (existingMovie.logisticScore === null ||
              existingMovie.logisticScore < movie.logisticScore))
        ) {
          movieMap.set(movie.title, movie);
        }
      });

      return Array.from(movieMap.values());
    }

    return filtered;
  }, [movies, sorting, searchQuery]);

  const table = useReactTable({
    columns,
    data: uniqueMovies,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const rows = table.getRowModel().rows;
  const hasNoResults = rows.length === 0;
  const isSearching = searchQuery.trim() !== "";

  return (
    <Flex direction="column" gap="4" width="100%">
      {cycles.length > 0 && (
        <Card style={{
          padding: "1.25rem",
          background: "rgba(249, 115, 22, 0.03)",
          border: "1px solid rgba(249, 115, 22, 0.15)",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)",
          marginBottom: "0.5rem"
        }}>
          <Flex direction="column" gap="1">
            <Heading as="h3" size="3" style={{ color: "#f97316", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <span style={{ fontSize: "1.1rem" }}>🔄</span> Cyclic Preference Contradictions ({cycles.length})
            </Heading>
            <Text size="2" style={{ color: "var(--gray-11)", marginBottom: "0.5rem" }}>
              The ranking algorithm detected circular preference loops (Rock-Paper-Scissors relations) in your watch history reviews.
            </Text>
            <Flex direction="column" gap="2" style={{ maxHeight: "150px", overflowY: "auto", paddingRight: "4px" }}>
              {cycles.map((cycle, index) => (
                <Text key={index} size="2" style={{ color: "var(--gray-12)" }}>
                  • <span style={{ fontWeight: 600 }}>{cycle[0]}</span> &gt; {cycle[1]} &gt; {cycle[2]} &gt; <span style={{ fontWeight: 600 }}>{cycle[0]}</span>
                </Text>
              ))}
            </Flex>
          </Flex>
        </Card>
      )}

      <Box style={{ maxWidth: "400px", width: "100%", marginBottom: "0.25rem" }}>
        <TextField.Root
          placeholder="Search watch history by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="3"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "9999px",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        >
          <TextField.Slot>
            <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>🔍</span>
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          background: "rgba(20, 20, 25, 0.45)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Table.Root variant="ghost" style={{ width: "100%" }}>
          <Table.Header className="premium-table-header">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  const sortHandler = header.column.getToggleSortingHandler();
                  return (
                  <Table.ColumnHeaderCell
                    key={header.id}
                    colSpan={header.colSpan}
                    className="premium-table-cell"
                    onClick={sortHandler}
                    tabIndex={canSort ? 0 : undefined}
                    onKeyDown={
                      canSort
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              sortHandler?.(e);
                            }
                          }
                        : undefined
                    }
                    aria-sort={
                      canSort
                        ? sortDir === "asc"
                          ? "ascending"
                          : sortDir === "desc"
                          ? "descending"
                          : "none"
                        : undefined
                    }
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      cursor: canSort ? "pointer" : "default",
                      userSelect: canSort ? "none" : "auto",
                    }}
                  >
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }} asChild>
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                      </Text>
                      <span style={{ width: "16px", fontSize: "0.75rem", color: "var(--blue-11)", opacity: 0.9 }}>
                        {{
                          asc: " ▲",
                          desc: " ▼",
                        }[header.column.getIsSorted() as string] ?? ""}
                      </span>
                    </Flex>
                  </Table.ColumnHeaderCell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {hasNoResults ? (
              <Table.Row>
                <Table.Cell
                  colSpan={columns.length}
                  className="premium-table-cell"
                  style={{ padding: "3rem 1.5rem", textAlign: "center" }}
                >
                  <Flex direction="column" gap="3" align="center">
                    <Text size="5" aria-hidden style={{ opacity: 0.5 }}>
                      🎬
                    </Text>
                    <Text size="3" weight="bold" style={{ color: "var(--gray-12)" }}>
                      {isSearching ? "No movies match your search" : "No movies to show"}
                    </Text>
                    {isSearching && (
                      <>
                        <Text size="2" style={{ color: "var(--gray-11)" }}>
                          Try a different title, or clear the search to see everything.
                        </Text>
                        <Button
                          variant="soft"
                          radius="full"
                          size="2"
                          onClick={() => setSearchQuery("")}
                        >
                          Clear search
                        </Button>
                      </>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              rows.map((row) => {
                const article = posts.find(
                  (post) => post.metadata.title === row.original.title
                );

                return (
                  <Table.Row key={row.id} className="premium-table-row">
                    {row.getVisibleCells().map((cell) => {
                      const value = flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      );

                      if (cell.column.id === "title") {
                        const poster = posters[row.original.title];
                        const thumb = poster?.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${poster.posterPath}`}
                            alt=""
                            width={34}
                            height={51}
                            className="movie-poster-thumb"
                          />
                        ) : (
                          <span
                            className="movie-poster-thumb movie-poster-thumb-empty"
                            aria-hidden
                          >
                            🎬
                          </span>
                        );

                        const titleEl = article ? (
                          <Link asChild style={{ fontWeight: "bold", color: "#ffffff" }}>
                            <NextLink href={`/${article.slug}`}>{value}</NextLink>
                          </Link>
                        ) : (
                          <span style={{ fontWeight: "bold", color: "#ffffff", fontSize: "0.875rem" }}>
                            {value}
                          </span>
                        );

                        return (
                          <Table.Cell key={cell.id} className="premium-table-cell" style={{ verticalAlign: "middle" }}>
                            <Flex align="center" gap="3">
                              {thumb}
                              {titleEl}
                            </Flex>
                          </Table.Cell>
                        );
                      }

                      if (cell.column.id === "dateWatched") {
                        return (
                          <Table.Cell key={cell.id} className="premium-table-cell" style={{ verticalAlign: "middle" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--gray-11)" }}>{value}</span>
                          </Table.Cell>
                        );
                      }

                      return (
                        <Table.Cell key={cell.id} className="premium-table-cell" style={{ verticalAlign: "middle" }}>
                          {value}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Card>
    </Flex>
  );
}
