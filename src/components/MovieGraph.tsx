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

  useEffect(() => {
    const { graph } = calculateRatings(watchHistory);

    // Adjust node size based on rating and position nodes with more spread
    setGraphData({
      nodes: graph.nodes.map((node) => ({
        ...node,
        val: 5 + node.rating * 15, // Scale the node size by rating, with a minimum size
        // Initialize nodes with much more spread
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 800 - 200, // Bias toward upper side of canvas
      })),
      // Create links with more distance between nodes and swap source/target to fix arrow direction
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
            border: "1px solid #ddd",
            borderRadius: "8px",
            position: "relative",
            background: "#f8f9fa",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              graphData={graphData}
              linkDirectionalArrowLength={10}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              nodeRelSize={6}
              // Adjust forces for a more spread-out layout that works with TypeScript
              d3AlphaDecay={0.01} // Slower decay for more time to find positions
              d3VelocityDecay={0.05} // Lower value = nodes move further (more spread)
              cooldownTicks={300} // More ticks = more time for layout
              warmupTicks={100} // Pre-simulation ticks
              linkColor={() => "rgba(0, 0, 0, 0.2)"}
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

                // Draw text background with improved visibility
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(
                  (node.x || 0) - bckgDimensions[0] / 2,
                  (node.y || 0) + (node.val || 10) / 2 + 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                // Draw text with better contrast
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#111";
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
                setHoveredNode(node as Node | null);
                document.body.style.cursor = node ? "pointer" : "default";
              }}
              onNodeClick={(node) => {
                // Clicking a node will slightly repel other nodes
                if (graphData && graphData.nodes) {
                  setGraphData((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((n) => {
                      if (n.id !== (node as Node).id) {
                        // Add a small random offset to other nodes
                        return {
                          ...n,
                          x: (n.x || 0) + (Math.random() - 0.5) * 100,
                          y: (n.y || 0) + (Math.random() - 0.5) * 100,
                        };
                      }
                      return n;
                    }),
                  }));
                }
              }}
            />
          )}

          {hoveredNode && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "white",
                padding: "10px",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                zIndex: 10,
              }}
            >
              <Text size="4" weight="bold">
                {hoveredNode.id}
              </Text>
              <Text size="2">Rating: {hoveredNode.rating.toFixed(1)}</Text>
            </div>
          )}
        </Box>

        <Text size="2" color="gray" style={{ textAlign: "center" }}>
          Tip: Click on nodes to spread them out and use the mouse wheel to zoom
          in/out.
        </Text>
      </Flex>
    </Box>
  );
}
