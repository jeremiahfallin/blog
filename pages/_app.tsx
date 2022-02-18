import "@fontsource/zen-kurenaido/400.css";
import "@fontsource/zen-maru-gothic/400.css";

import React from "react";
import { ChakraProvider, extendTheme, ThemeConfig } from "@chakra-ui/react";
import "../styles/globals.css";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: true,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "Zen Kurenaido",
    body: "Zen Maru Gothic",
  },
  colors: {
    brand: {
      900: "#1a365d",
      800: "#153e75",
      700: "#2a69ac",
    },
  },
  styles: {
    global: {
      "body, html": {
        minWidth: "100%",
        overflowX: "hidden",
      },
      "&::-webkit-scrollbar": {
        width: "4px",
      },
      "&::-webkit-scrollbar-track": {
        background: "cyan.900",
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "green.900",
        borderRadius: "24px",
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
