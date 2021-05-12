import React from "react";

import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  *, *:before, *:after {
    box-sizing: border-box;
    font-family: Futura, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  html {
    height: 100%;
    font-size: 10px;
    margin: 0;
  }
  body {
    margin: 0;
    height: 100%;
    background: var(--color-background);
    color: var(--color-text);
    line-height: 1.4;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    font-size: 2rem;
    transition: all 0.50s ease-in-out;
  }
  /* Scrollbar Styles */
  body::-webkit-scrollbar {
    width: 12px;
  }
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) var(--color-secondary);
  }
  body::-webkit-scrollbar-track {
    background: var(--color-background);
  }
  body::-webkit-scrollbar-thumb {
    background-color: var(--color-primary) ;
    border-radius: 6px;
    border: 3px solid var(--color-background);
  }
  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  img {
    width: 100%;
    grid-column: 1 / -1;
    max-width: 100%;
  }
`;

export default GlobalStyles;
