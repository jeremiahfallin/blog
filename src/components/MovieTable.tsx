"use client";
import { useState } from "react";
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

type WatchHistoryWithScore = (typeof watchHistory)[number] & {
  score: number;
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
    cell: (props) => props.getValue(),
  }),
  columnHelper.accessor("score", {
    header: "Score",
    cell: (props) => props.getValue().toFixed(2),
  }),
];

const ratings = calculateRatings(watchHistory);

const defaultData = watchHistory.map((watch) => ({
  ...watch,
  score: 100 * (ratings.ratings[watch.title] || 0),
}));

export default function MovieTable({ posts }: { posts: BlogPostData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: defaultData,
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

                if (cell.column.id === "score") {
                  return <Table.Cell key={cell.id}>{value}</Table.Cell>;
                }

                if (cell.column.id === "betterThanPrevious") {
                  return (
                    <Table.Cell key={cell.id}>
                      {cell.getValue() ? "Yes" : "No"}
                    </Table.Cell>
                  );
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
