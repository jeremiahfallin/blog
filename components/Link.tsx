import React from "react";
import NextLink from "next/link";
import { Link, useColorMode } from "@chakra-ui/react";

export default function ProjectLink({
  children,
  href,
  fontColor = null,
  ...rest
}) {
  const { colorMode } = useColorMode();
  const linkColor = fontColor
    ? fontColor
    : colorMode === "dark"
    ? "green.400"
    : "green.600";
  return (
    <NextLink href={href} {...rest}>
      <Link color={linkColor}>{children}</Link>
    </NextLink>
  );
}
