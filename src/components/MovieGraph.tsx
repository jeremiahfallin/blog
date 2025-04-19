"use client";
import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { calculateRatings } from "@/utils/calculateRatings";
import watchHistory from "@/movie-watch-history.json";
import { Box, Callout, Flex, Text } from "@radix-ui/themes";

type Node = {
  id: string;
  rating: number;
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

export default function MovieGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [ratingRange, setRatingRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });

  useEffect(() => {
    const { graph } = calculateRatings(watchHistory);

    // Find min and max ratings in the data
    let minRating = Number.MAX_VALUE;
    let maxRating = Number.MIN_VALUE;

    graph.nodes.forEach((node) => {
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
      nodes: graph.nodes.map((node) => ({
        ...node,
        val: 5 + node.rating * 200, // Significantly increase the scaling factor for more noticeable size differences
        color: getNodeColor(node.rating), // Apply color based on rating
        // Initialize nodes with much more spread
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 800 - 200, // Bias toward upper side of canvas
      })),
      // Create links with more distance between nodes
      links: graph.links.map((link) => ({
        ...link,
        // Swap source and target to correct arrow direction
        source: link.target,
        target: link.source,
        // This doesn't directly change distance but helps the ForceGraph spacing
        value: 20, // Higher value = more spacing
      })),
    });
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
            border: "1px solid #333",
            borderRadius: "8px",
            position: "relative",
            background: "#121212",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
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

                // Draw node circle
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

                // Draw text background with improved visibility for dark mode
                ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
                ctx.fillRect(
                  (node.x || 0) - bckgDimensions[0] / 2,
                  (node.y || 0) + (node.val || 10) / 2 + 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                // Draw text with better contrast for dark mode
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#eee";
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
              top: "10px",
              left: "10px",
              background: "#222",
              padding: "10px",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
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
                width="100%"
                style={{
                  background:
                    "linear-gradient(to right, #e74c3c, #f39c12, #f1c40f, #27ae60)",
                  borderRadius: "4px",
                }}
              />
              <Flex justify="between" width="100%">
                <Text size="2" style={{ color: "#bbb" }}>
                  {(100 * ratingRange.min).toFixed(2)}
                </Text>
                <Text size="2" style={{ color: "#bbb" }}>
                  Rating
                </Text>
                <Text size="2" style={{ color: "#bbb" }}>
                  {(100 * ratingRange.max).toFixed(2)}
                </Text>
              </Flex>
              <Text size="1" mt="2" style={{ opacity: 0.7, color: "#999" }}>
                Node size also increases with rating
              </Text>
            </Flex>
          </Flex>

          {hoveredNode && (
            <Flex
              position={"absolute"}
              direction="column"
              top="10px"
              right="10px"
              p="2"
              style={{
                background: "#222",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                zIndex: 10,
                color: "#eee",
              }}
            >
              <Text size="4" weight="bold" style={{ color: "#eee" }}>
                {hoveredNode.id}
              </Text>
              <Text size="2" style={{ color: "#bbb" }}>
                Rating:{" "}
                <span style={{ fontWeight: "bold", color: hoveredNode.color }}>
                  {(100 * hoveredNode.rating).toFixed(2)}
                </span>
              </Text>
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
