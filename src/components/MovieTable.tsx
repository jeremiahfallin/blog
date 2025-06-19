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
import { BlogPostData } from "@/getBlogPosts";

// Define types for our movie data
type WatchHistoryEntry = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
};

type WatchHistoryWithScore = WatchHistoryEntry & {
  btscore: number;
  viewCount: number;
  logisticScore: number | null;
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

export default function MovieTable({ posts }: { posts: BlogPostData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [movieData, setMovieData] = useState<WatchHistoryWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pre-calculated movie data from our API
  useEffect(() => {
    async function fetchMovieData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/movies");

        if (!response.ok) {
          throw new Error("Failed to fetch movie data");
        }

        const data = await response.json();
        setMovieData(data);
      } catch (error) {
        console.error("Error fetching movie data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovieData();
  }, []); // Empty dependency array means this runs once on mount

  // Determine unique movies based on sorting criteria
  const uniqueMovies = useMemo(() => {
    if (
      sorting.length > 0 &&
      (sorting[0].id === "btscore" ||
        sorting[0].id === "viewCount" ||
        sorting[0].id === "logisticScore")
    ) {
      const movieMap = new Map<string, WatchHistoryWithScore>();

      movieData.forEach((movie) => {
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

    return movieData;
  }, [movieData, sorting]);

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

  // Show loading state while fetching data
  if (isLoading) {
    return <div>Loading movie data...</div>;
  }

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
