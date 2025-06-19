import type { NextConfig } from "next";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  serverExternalPackages: ["@tensorflow/tfjs-node"],

  // @ts-ignore - Next.js types don't fully cover the webpack config options
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // For Node.js modules that are imported on the server
    if (isServer) {
      // Let Next.js handle Node.js modules properly
      return config;
    }

    // For client-side, exclude tfjs-node from the bundle
    config.resolve.alias["@tensorflow/tfjs-node"] = false;

    return config;
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
