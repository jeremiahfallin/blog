import {
  Heading,
  Text,
  Link as RadixLink,
  Code,
  Separator,
  Box,
} from "@radix-ui/themes";
import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <Heading
        as="h1"
        size="7"
        style={{
          marginTop: "2rem",
          marginBottom: "1.5rem",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {children}
      </Heading>
    ),
    h2: ({ children }) => (
      <Heading
        as="h2"
        size="6"
        style={{
          marginTop: "2.5rem",
          marginBottom: "1.25rem",
          fontWeight: 600,
          lineHeight: 1.3,
          position: "relative",
          paddingBottom: "0.5rem",
        }}
        className="heading-underline"
      >
        {children}
      </Heading>
    ),
    h3: ({ children }) => (
      <Heading
        as="h3"
        size="4"
        style={{
          marginTop: "2rem",
          marginBottom: "1rem",
          fontWeight: 600,
          color: "var(--gray-12)",
          lineHeight: 1.4,
        }}
      >
        {children}
      </Heading>
    ),
    h4: ({ children }) => (
      <Heading
        as="h4"
        size="3"
        style={{
          marginTop: "1.75rem",
          marginBottom: "0.75rem",
          fontWeight: 600,
          color: "var(--gray-11)",
        }}
      >
        {children}
      </Heading>
    ),
    h5: ({ children }) => (
      <Heading
        as="h5"
        size="2"
        style={{
          marginTop: "1.5rem",
          marginBottom: "0.75rem",
          fontWeight: 600,
          color: "var(--gray-11)",
        }}
      >
        {children}
      </Heading>
    ),
    h6: ({ children }) => (
      <Heading
        as="h6"
        size="1"
        style={{
          marginTop: "1.5rem",
          marginBottom: "0.5rem",
          fontWeight: 600,
          color: "var(--gray-10)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {children}
      </Heading>
    ),
    p: ({ children }) => (
      <Text
        as="p"
        size="3"
        style={{
          marginBottom: "1.5rem",
          lineHeight: 1.8,
          color: "var(--gray-12)",
        }}
      >
        {children}
      </Text>
    ),
    a: ({ href, children }) => {
      const isExternal = href?.startsWith("http");
      return isExternal ? (
        <RadixLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          highContrast
          className="mdx-link"
        >
          {children}
        </RadixLink>
      ) : (
        <Link href={href || "#"} passHref legacyBehavior>
          <RadixLink highContrast className="mdx-link">
            {children}
          </RadixLink>
        </Link>
      );
    },
    ul: ({ children }) => (
      <div
        style={{
          marginBottom: "1.75rem",
          paddingLeft: "1.75rem",
        }}
      >
        <ul className="mdx-list">{children}</ul>
      </div>
    ),
    ol: ({ children }) => (
      <div
        style={{
          marginBottom: "1.75rem",
          paddingLeft: "1.75rem",
        }}
      >
        <ol className="mdx-list">{children}</ol>
      </div>
    ),
    li: ({ children }) => (
      <li
        style={{
          marginBottom: "0.75rem",
          lineHeight: 1.7,
          fontSize: "var(--font-size-3)",
          paddingLeft: "0.25rem",
        }}
      >
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <div
        style={{
          marginBottom: "1.75rem",
          marginLeft: 0,
          marginRight: 0,
          borderRadius: "8px",
          padding: "1rem 1.5rem",
          backgroundColor: "var(--gray-3)",
          borderLeft: "4px solid var(--gray-6)",
        }}
        className="mdx-blockquote"
      >
        <blockquote>{children}</blockquote>
      </div>
    ),
    hr: () => <Separator size="4" style={{ margin: "3rem 0" }} />,
    strong: ({ children }) => (
      <strong style={{ fontWeight: "bold" }}>{children}</strong>
    ),
    em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
    code: ({ children }) => <Code className="mdx-code">{children}</Code>,
    img: (props) => (
      <Box style={{ margin: "2.5rem 0" }}>
        <Image
          sizes="100vw"
          width={1000}
          height={1000}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          }}
          {...(props as ImageProps)}
          alt={props?.alt ?? ""}
          className="mdx-image"
        />
        {props?.alt && (
          <Text
            as="p"
            size="1"
            style={{
              marginTop: "0.75rem",
              textAlign: "center",
              color: "var(--gray-10)",
            }}
          >
            {props.alt}
          </Text>
        )}
      </Box>
    ),
    ...components,
  };
}
