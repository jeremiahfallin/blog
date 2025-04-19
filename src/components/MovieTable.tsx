"use client";
import { useState, useMemo, useEffect } from "react";
import { Box, Flex, Link, Table } from "@radix-ui/themes";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import watchHistory from "@/movie-watch-history.json";
import { BlogPostData } from "@/getBlogPosts";
import { calculateRatings } from "@/utils/calculateRatings";
import { calculateLogisticRatings } from "@/utils/calculateLogisticRatings";

// Define MovieRatings type here or import if defined elsewhere
type MovieRatings = { [title: string]: number };

type WatchHistoryWithScore = (typeof watchHistory)[number] & {
  btscore: number;
  viewCount: number;
  logisticScore: number | null; // Add logisticScore, allow null for loading state
};

const columnHelper = createColumnHelper<WatchHistoryWithScore>();

const columns = [
  columnHelper.accessor("order", {
    header: "Order",
    cell: (props) => props.getValue(),
  }),
  columnHelper.accessor("title", {
    header: "Title",
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
      if (
        props.table.getState().sorting.length === 0 ||
        (props.table.getState().sorting.length === 1 &&
          props.table.getState().sorting[0].id === "order" &&
          props.table.getState().sorting[0].desc === false)
      ) {
        return props.getValue() ? "Yes" : "No";
      }
      return "N/A";
    },
  }),
  columnHelper.accessor("viewCount", {
    header: "View Count",
    cell: (props) => props.getValue(),
  }),
  columnHelper.accessor("btscore", {
    header: "BT Score",
    cell: (props) => props.getValue().toFixed(2),
  }),
  // Add column for logistic score
  columnHelper.accessor("logisticScore", {
    header: "Logistic Score",
    cell: (props) => {
      const score = props.getValue();
      return score !== null ? score.toFixed(4) : "Calculating..."; // Show loading state
    },
  }),
];

// Calculate view counts
const getViewCounts = () => {
  const counts: Record<string, number> = {};
  watchHistory.forEach((movie) => {
    counts[movie.title] = (counts[movie.title] || 0) + 1;
  });
  return counts;
};

const viewCounts = getViewCounts();
const ratings = calculateRatings(watchHistory);

export default function MovieTable({ posts }: { posts: BlogPostData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [logisticRatings, setLogisticRatings] = useState<MovieRatings | null>(
    null
  );

  // Effect to calculate logistic ratings on mount
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const calculatedRatings = await calculateLogisticRatings(watchHistory);
        setLogisticRatings(calculatedRatings);
      } catch (error) {
        console.error("Error calculating logistic ratings:", error);
        setLogisticRatings({}); // Set to empty object on error or handle differently
      }
    };
    fetchRatings();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Calculate defaultData inside the component using useMemo
  const defaultData = useMemo(() => {
    return watchHistory.map((watch) => ({
      ...watch,
      btscore: 100 * (ratings.ratings[watch.title] || 0),
      viewCount: viewCounts[watch.title],
      // Add logistic score, defaulting to null if not calculated yet
      logisticScore:
        logisticRatings && logisticRatings[watch.title] !== undefined
          ? logisticRatings[watch.title]
          : null,
    }));
  }, [logisticRatings]); // Recalculate when logisticRatings state changes

  const uniqueMovies = useMemo(() => {
    if (
      sorting.length > 0 &&
      (sorting[0].id === "btscore" ||
        sorting[0].id === "viewCount" ||
        sorting[0].id === "logisticScore") // Add logisticScore here
    ) {
      const movieMap = new Map<string, WatchHistoryWithScore>(); // Add type hint for clarity

      defaultData.forEach((movie) => {
        const existingMovie = movieMap.get(movie.title);
        if (
          !existingMovie ||
          (sorting[0].id === "btscore" && existingMovie.score < movie.score) ||
          (sorting[0].id === "viewCount" &&
            existingMovie.viewCount < movie.viewCount) ||
          // Add condition for logisticScore
          (sorting[0].id === "logisticScore" &&
            movie.logisticScore !== null && // Make sure score is calculated
            (existingMovie.logisticScore === null || // Prioritize non-null scores
              existingMovie.logisticScore < movie.logisticScore))
        ) {
          movieMap.set(movie.title, movie);
        }
      });

      return Array.from(movieMap.values());
    }

    return defaultData;
  }, [defaultData, sorting]);

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

  return (
    <Table.Root>
      <Table.Header>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Row key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Table.ColumnHeaderCell key={header.id} colSpan={header.colSpan}>
                <Box
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    userSelect: header.column.getCanSort() ? "none" : "auto",
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                  title={
                    header.column.getCanSort()
                      ? header.column.getNextSortingOrder() === "asc"
                        ? "Sort ascending"
                        : header.column.getNextSortingOrder() === "desc"
                        ? "Sort descending"
                        : "Clear sort"
                      : undefined
                  }
                >
                  <Flex align="center" gap="2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <span style={{ width: "16px" }}>
                      {{
                        asc: "🔼",
                        desc: "🔽",
                      }[header.column.getIsSorted() as string] ?? ""}
                    </span>
                  </Flex>
                </Box>
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        ))}
      </Table.Header>
      <Table.Body>
        {table.getRowModel().rows.map((row) => {
          const article = posts.find(
            (post) => post.metadata.title === row.original.title
          );

          return (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const value = flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                );

                if (cell.column.id === "btscore") {
                  return (
                    <Table.Cell key={cell.id}>
                      <Flex>{value}</Flex>
                    </Table.Cell>
                  );
                }

                if (
                  cell.column.id === "betterThanPrevious" ||
                  cell.column.id === "viewCount"
                ) {
                  return <Table.Cell key={cell.id}>{value}</Table.Cell>;
                }

                if (cell.column.id === "title") {
                  if (article) {
                    return (
                      <Table.Cell key={cell.id}>
                        <Link href={article.slug}>{value}</Link>
                      </Table.Cell>
                    );
                  }

                  return <Table.Cell key={cell.id}>{value}</Table.Cell>;
                }

                return <Table.Cell key={cell.id}>{value}</Table.Cell>;
              })}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
