import type { NextConfig } from "next";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  images: {
    // Next 16 only allows quality 75 by default and rounds every other
    // `quality` prop to the nearest allowed value. List the ones in use.
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
