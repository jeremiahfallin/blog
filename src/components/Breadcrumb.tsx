import { Flex, Link, Text } from "@radix-ui/themes";
import NextLink from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <Flex
      gap="2"
      align="center"
      mb="4"
      wrap="wrap"
      style={{ fontSize: "0.85rem" }}
      aria-label="Breadcrumb"
      asChild
    >
      <nav>
        {items.map((item, i) => (
          <Flex key={`${item.label}-${i}`} gap="2" align="center">
            {i > 0 && (
              <Text size="2" style={{ color: "var(--gray-9)" }}>
                /
              </Text>
            )}
            {item.href ? (
              <Link asChild color="gray" highContrast={false}>
                <NextLink href={item.href}>{item.label}</NextLink>
              </Link>
            ) : (
              <Text size="2" style={{ color: "var(--gray-12)", fontWeight: 600 }}>
                {item.label}
              </Text>
            )}
          </Flex>
        ))}
      </nav>
    </Flex>
  );
}
