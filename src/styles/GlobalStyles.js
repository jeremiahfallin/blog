import React from "react";

import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  *, *:before, *:after {
    box-sizing: border-box;
    font-family: Futura, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  body {
    background: var(--color-background);
    color: var(--color-text);
    line-height: 1.4;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    transition: all 0.50s ease-in-out;
  }
  a {
    color: var(--color-primary);
    text-decoration: none;
  }
`;

export default GlobalStyles;
