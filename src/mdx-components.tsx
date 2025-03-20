import { Heading } from "@radix-ui/themes";
import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <Heading as="h1" size={"5"}>
        {children}
      </Heading>
    ),
    h2: ({ children }) => (
      <Heading as="h2" size={"4"}>
        {children}
      </Heading>
    ),
    h3: ({ children }) => (
      <Heading as="h3" size={"4"}>
        {children}
      </Heading>
    ),
    h4: ({ children }) => (
      <Heading as="h4" size={"3"}>
        {children}
      </Heading>
    ),
    h5: ({ children }) => (
      <Heading as="h5" size={"2"}>
        {children}
      </Heading>
    ),
    h6: ({ children }) => (
      <Heading as="h6" size={"1"}>
        {children}
      </Heading>
    ),
    img: (props) => (
      <Image
        sizes="100vw"
        width={1000}
        height={1000}
        style={{ width: "100%", height: "auto" }}
        {...(props as ImageProps)}
        alt={props?.alt ?? ""}
      />
    ),
    ...components,
  };
}
