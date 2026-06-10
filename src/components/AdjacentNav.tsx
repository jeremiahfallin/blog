import { Box, Card, Flex, Text } from "@radix-ui/themes";
import NextLink from "next/link";

export interface AdjacentEntry {
  href: string;
  title: string;
}

interface AdjacentNavProps {
  prev?: AdjacentEntry;
  next?: AdjacentEntry;
}

export default function AdjacentNav({ prev, next }: AdjacentNavProps) {
  if (!prev && !next) return null;

  return (
    <Flex justify="between" gap="3" mt="6" wrap="wrap" className="adjacent-nav">
      {prev ? (
        <Card asChild className="adjacent-nav-card" style={{ flex: "1 1 240px" }}>
          <NextLink href={prev.href}>
            <Flex direction="column" p="2" gap="1">
              <Text size="1" style={{ color: "var(--gray-10)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                ← Previous
              </Text>
              <Text as="div" size="3" weight="bold" style={{ color: "var(--gray-12)" }}>
                {prev.title}
              </Text>
            </Flex>
          </NextLink>
        </Card>
      ) : (
        <Box style={{ flex: "1 1 240px" }} />
      )}
      {next ? (
        <Card asChild className="adjacent-nav-card" style={{ flex: "1 1 240px" }}>
          <NextLink href={next.href}>
            <Flex direction="column" p="2" gap="1" align="end">
              <Text size="1" style={{ color: "var(--gray-10)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Next →
              </Text>
              <Text as="div" size="3" weight="bold" style={{ color: "var(--gray-12)", textAlign: "right" }}>
                {next.title}
              </Text>
            </Flex>
          </NextLink>
        </Card>
      ) : (
        <Box style={{ flex: "1 1 240px" }} />
      )}
    </Flex>
  );
}
