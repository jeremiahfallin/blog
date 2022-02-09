import React, { useMemo, ReactHTMLElement } from "react";
import Image from "next/image";
import { getMDXComponent } from "mdx-bundler/client";
import Link from "next/link";
import { Heading, Text, Grid, GridItem, Center } from "@chakra-ui/react";
import { omit } from "@arcath/utils/lib/functions/pick";
import { OutboundLink } from "react-ga";

import { Code } from "./code";

const Img: React.FC<any> = (props) => {
  return (
    <div className="relative w-full">
      <Image {...props} layout="fill" objectFit="none" />
    </div>
  );
};

const Paragraph: React.FC<any> = (props) => {
  if (typeof props.children !== "string" && props.children.type === "img") {
    return (
      <GridItem colSpan={5}>
        <Center>{props.children}</Center>
      </GridItem>
    );
  }

  return (
    <GridItem colStart={3}>
      <Text {...props} />
    </GridItem>
  );
};

const Anchor: React.FC<
  Partial<ReactHTMLElement<HTMLAnchorElement>["props"]>
> = (props) => {
  const { href, children } = props;

  if (!href) {
    return <a {...props} />;
  }

  if (href!.substr(0, 4) === "http") {
    return (
      <OutboundLink eventLabel="Content Outbound Link" to={href!}>
        {children}
      </OutboundLink>
    );
  }

  return (
    <Link href={href!}>
      <a>{children}</a>
    </Link>
  );
};

export const components = {
  //img: Img,
  p: Paragraph,
  a: Anchor,
  pre: (preProps: Partial<ReactHTMLElement<HTMLPreElement>["props"]>) => {
    const props = preToCodeBlock(preProps);

    if (props) {
      return <Code {...props} />;
    }

    return <pre {...preProps} />;
  },
};

export const MDX: React.FC<{ source: string }> = ({ source }) => {
  const Component = useMemo(() => getMDXComponent(source), [source]);

  return <Component components={components} />;
};

export const Content: React.FC<{ source: any; heading: string }> = ({
  source,
  heading,
}) => {
  return (
    <ContentContainer>
      <Heading>{heading}</Heading>
      <MDX source={source} />
    </ContentContainer>
  );
};

export const ContentContainer: React.FC = ({ children }) => {
  return <>{children}</>;
};

const preToCodeBlock = (
  preProps: any
): {
  language: string;
  codeString: string;
  line?: string;
  fileName?: string;
  url?: string;
  className: string;
} => {
  if (
    // children is code element
    preProps.children &&
    // code props
    preProps.children.props &&
    // if children is actually a <code>
    preProps.children.type === "code"
  ) {
    // we have a <pre><code> situation
    const {
      children: codeString,
      className = "",
      ...props
    } = preProps.children.props;

    const matches = className.match(/language-(?<lang>.*)/);

    return {
      codeString: codeString.trim(),
      className,
      line: props.line,
      fileName: props.filename,
      language:
        matches && matches.groups && matches.groups.lang
          ? matches.groups.lang
          : "",
      ...omit(props, ["children"]),
    };
  }
};
