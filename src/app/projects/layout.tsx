import { Box, Flex } from "@radix-ui/themes";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Box p="2">
      <Flex direction="column">{children}</Flex>
    </Box>
  );
}
