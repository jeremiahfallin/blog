"use client";
import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Box, Callout, Flex, Text } from "@radix-ui/themes";

type Node = {
  id: string;
  rating: number;
  uncertainty?: number;
  val?: number;
  x?: number;
  y?: number;
  fx?: number | undefined;
  fy?: number | undefined;
  color?: string;
  __bckgDimensions?: [number, number];
};

type Link = {
  source: string;
  target: string;
  weight: number;
  value?: number;
};

type GraphData = {
  nodes: Node[];
  links: Link[];
};

interface MovieApiData {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
  btscore: number;
  viewCount: number;
  logisticScore: number | null;
}

export default function MovieGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [movieData, setMovieData] = useState<Record<string, MovieApiData>>({});
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [ratingRange, setRatingRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });

  useEffect(() => {
    async function fetchMovieData() {
      try {
        const response = await fetch("/api/movies");
        if (response.ok) {
          const data = await response.json();
          const movies = data.movies || [];
          const map: Record<string, MovieApiData> = {};
          movies.forEach((movie: MovieApiData) => {
            map[movie.title] = movie;
          });
          setMovieData(map);

          if (data.graph) {
            const graph = data.graph;

            // Find min and max ratings in the data
            let minRating = Number.MAX_VALUE;
            let maxRating = Number.MIN_VALUE;

            graph.nodes.forEach((node: Node) => {
              if (node.rating < minRating) minRating = node.rating;
              if (node.rating > maxRating) maxRating = node.rating;
            });

            // Store the rating range for legend display
            setRatingRange({ min: minRating, max: maxRating });

            // Define a color spectrum function based on actual rating range
            const getNodeColor = (rating: number) => {
              // Normalize rating to 0-1 range
              const normalizedRating = (rating - minRating) / (maxRating - minRating);

              // Create color spectrum from red (low) to yellow to green (high)
              if (normalizedRating < 0.33) {
                // Red to orange: mix red with increasing yellow
                const yellowAmount = normalizedRating * 3; // 0 to 1 within this range
                return `rgb(231, ${Math.floor(76 + yellowAmount * 100)}, 60)`;
              } else if (normalizedRating < 0.66) {
                // Orange to yellow: decrease red while keeping yellow high
                const adjustedValue = (normalizedRating - 0.33) * 3; // 0 to 1 within this range
                return `rgb(${Math.floor(231 - adjustedValue * 40)}, ${Math.floor(
                  176 + adjustedValue * 20
                )}, 60)`;
              } else {
                // Yellow to green: decrease red while keeping green high
                const adjustedValue = (normalizedRating - 0.66) * 3; // 0 to 1 within this range
                return `rgb(${Math.floor(191 - adjustedValue * 150)}, ${Math.floor(
                  196 + adjustedValue * 30
                )}, ${Math.floor(60 + adjustedValue * 36)})`;
              }
            };

            // Adjust node size based on rating and position nodes with more spread
            setGraphData({
              nodes: graph.nodes.map((node: Node) => ({
                ...node,
                val: 5 + node.rating * 200, // Significantly increase the scaling factor for more noticeable size differences
                color: getNodeColor(node.rating), // Apply color based on rating
                // Initialize nodes with much more spread
                x: (Math.random() - 0.5) * 1200,
                y: (Math.random() - 0.5) * 800 - 200, // Bias toward upper side of canvas
              })),
              // Create links with more distance between nodes
              links: graph.links.map((link: Link) => ({
                ...link,
                // Swap source and target to correct arrow direction
                source: link.target,
                target: link.source,
                // This doesn't directly change distance but helps the ForceGraph spacing
                value: 20, // Higher value = more spacing
              })),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching movie data for graph:", error);
      }
    }
    fetchMovieData();
  }, []);

  return (
    <Box>
      <Flex direction="column" gap="3">
        <Text size="5" weight="bold">
          Interactive Movie Graph
        </Text>
        <Text size="2" color="gray">
          This graph visualizes how movies compare to each other based on the
          watch history. Each node represents a movie, with larger and darker
          nodes having higher ratings. Arrows indicate comparisons, with the
          arrow pointing from better to worse movies.
        </Text>

        <Box>
          <Flex gap="2" py="2" align="center">
            <Callout.Root>
              <Callout.Text size="2">
                Note: The graph visualization uses advanced web features and may
                not work in all environments. If you encounter issues, please
                use the Table View instead.
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Box>

        <Box
          ref={containerRef}
          style={{
            width: "100%",
            height: "70vh",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            position: "relative",
            background: "rgba(10, 10, 15, 0.55)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
          }}
        >
          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              graphData={graphData}
              linkDirectionalArrowLength={10}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              nodeRelSize={2}
              // Adjust forces for a more spread-out layout that works with TypeScript
              d3AlphaDecay={0.01} // Slower decay for more time to find positions
              d3VelocityDecay={0.05} // Lower value = nodes move further (more spread)
              cooldownTicks={300} // More ticks = more time for layout
              warmupTicks={100} // Pre-simulation ticks
              linkColor={() => "rgba(255, 255, 255, 0.2)"}
              linkWidth={(link) => (link.weight as number) * 2}
              nodeCanvasObject={(node: Node, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions: [number, number] = [
                  textWidth + fontSize * 0.2,
                  fontSize + fontSize * 0.2,
                ];

                // Draw node circle (always)
                ctx.beginPath();
                ctx.arc(
                  node.x || 0,
                  node.y || 0,
                  (node.val || 10) / 2,
                  0,
                  2 * Math.PI
                );
                ctx.fillStyle = node.color || "#666";
                ctx.fill();

                // Compute label alpha based on zoom and hover state.
                // Hovered node always fully visible; other labels fade out as the user zooms out.
                // globalScale ~ 1.0 at default zoom; <0.5 means zoomed far out, >1.5 means zoomed in.
                const isHovered = hoveredNode?.id === node.id;
                const labelAlpha = isHovered
                  ? 1
                  : Math.min(1, Math.max(0, (globalScale - 0.6) * 1.8));

                if (labelAlpha <= 0.02) {
                  node.__bckgDimensions = bckgDimensions;
                  return;
                }

                // Draw text background with improved visibility for dark mode
                ctx.fillStyle = `rgba(30, 30, 30, ${0.9 * labelAlpha})`;
                ctx.fillRect(
                  (node.x || 0) - bckgDimensions[0] / 2,
                  (node.y || 0) + (node.val || 10) / 2 + 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                // Draw text with fade
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = `rgba(238, 238, 238, ${labelAlpha})`;
                ctx.fillText(
                  label,
                  node.x || 0,
                  (node.y || 0) +
                    (node.val || 10) / 2 +
                    2 +
                    bckgDimensions[1] / 2
                );

                node.__bckgDimensions = bckgDimensions;
              }}
              nodePointerAreaPaint={(node: Node, color, ctx) => {
                ctx.fillStyle = color;
                const radius = (node.val || 10) / 2;
                ctx.beginPath();
                ctx.arc(node.x || 0, node.y || 0, radius + 15, 0, 2 * Math.PI); // Increased clickable area
                ctx.fill();
              }}
              onNodeHover={(node) => {
                // When a node is hovered, find the original node data with its correct rating
                if (node) {
                  const originalNode = graphData.nodes.find(
                    (n) => n.id === node.id
                  );
                  setHoveredNode(originalNode || null);
                } else {
                  setHoveredNode(null);
                }
                document.body.style.cursor = node ? "pointer" : "default";
              }}
            />
          )}

          {/* Add a legend for the rating colors */}
          <Flex
            direction={"column"}
            gap="1"
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "rgba(20, 20, 25, 0.75)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "12px",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
              zIndex: 10,
              color: "#eee",
            }}
          >
            <Text size="3" weight="bold" mb="2" style={{ color: "#eee" }}>
              Rating Legend
            </Text>
            <Flex direction="column" gap="2">
              <Box
                height={"20px"}
                width="120px"
                style={{
                  background:
                    "linear-gradient(to right, #e74c3c, #f39c12, #f1c40f, #27ae60)",
                  borderRadius: "4px",
                }}
              />
              <Flex justify="between" width="100%">
                <Text size="1" style={{ color: "#bbb" }}>
                  {(100 * ratingRange.min).toFixed(2)}
                </Text>
                <Text size="1" style={{ color: "#bbb" }}>
                  Rating
                </Text>
                <Text size="1" style={{ color: "#bbb" }}>
                  {(100 * ratingRange.max).toFixed(2)}
                </Text>
              </Flex>
              <Text size="1" mt="1" style={{ opacity: 0.6, color: "#999" }}>
                Size scales with score
              </Text>
            </Flex>
          </Flex>

          {hoveredNode && (
            <Flex
              position={"absolute"}
              direction="column"
              bottom="12px"
              right="12px"
              p="3"
              style={{
                background: "rgba(20, 20, 25, 0.75)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
                zIndex: 10,
                color: "#eee",
                minWidth: "160px",
              }}
            >
              <Text size="3" weight="bold" style={{ color: "#eee", marginBottom: "4px" }}>
                {hoveredNode.id}
              </Text>
              <Text size="2" style={{ color: "#bbb" }}>
                BT Score:{" "}
                <span style={{ fontWeight: "bold", color: hoveredNode.color }}>
                  {(100 * hoveredNode.rating).toFixed(2)}
                  {hoveredNode.uncertainty !== undefined && ` (±${(100 * hoveredNode.uncertainty).toFixed(2)})`}
                </span>
              </Text>
              {movieData[hoveredNode.id]?.logisticScore !== undefined && (
                <Text size="2" style={{ color: "#bbb" }}>
                  Logistic Score:{" "}
                  <span style={{ fontWeight: "bold", color: "#60a5fa" }}>
                    {movieData[hoveredNode.id].logisticScore !== null
                      ? (movieData[hoveredNode.id].logisticScore as number).toFixed(4)
                      : "Calculating..."}
                  </span>
                </Text>
              )}
              {movieData[hoveredNode.id]?.viewCount !== undefined && (
                <Text size="1" style={{ color: "#999", marginTop: "4px" }}>
                  Views: {movieData[hoveredNode.id].viewCount}
                </Text>
              )}
            </Flex>
          )}
        </Box>

        <Text size="2" color="gray" style={{ textAlign: "center" }}>
          Tip: Use the mouse wheel to zoom in/out and drag to pan around the
          graph.
        </Text>
      </Flex>
    </Box>
  );
}
