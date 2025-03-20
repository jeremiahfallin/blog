"use client";
import { useState } from "react";
import { Box, Flex, Tabs } from "@radix-ui/themes";
import MovieTable from "./MovieTable";
import MovieGraph from "./MovieGraph";
import { BlogPostData } from "@/getBlogPosts";

export default function MovieViewer({ posts }: { posts: BlogPostData[] }) {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");

  return (
    <Box my="4">
      <Tabs.Root
        defaultValue="table"
        onValueChange={(value) => setViewMode(value as "table" | "graph")}
      >
        <Tabs.List>
          <Tabs.Trigger value="table">Table View</Tabs.Trigger>
          <Tabs.Trigger value="graph">Graph View</Tabs.Trigger>
        </Tabs.List>

        <Box mt="4">
          {viewMode === "table" ? (
            <MovieTable posts={posts} />
          ) : (
            <Flex direction="column" gap="4">
              <MovieGraph />
            </Flex>
          )}
        </Box>
      </Tabs.Root>
    </Box>
  );
}
