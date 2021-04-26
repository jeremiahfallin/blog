import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import GlobalStyles from "../styles/GlobalStyles";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Toggle from "./Toggle";

const LayoutStyle = styled.div`
  font-family: Montserrat, sans-serif;
  position: relative;
  display: grid;
  /* Extra small devices (phones, 600px and down) */
  @media only screen and (max-width: 600px) {
    grid-auto-flow: row;
    width: 100vw;
  }
  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 600px) {
    grid-template-columns: 2fr 1fr 2fr;
    grid-column-gap: 100px;
    height: 100vh;
  }
`;

const BodyStyle = styled.div`
  @media only screen and (max-width: 600px) {
    padding: 0 40px;
  }
  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 600px) {
  }
`;

const ToggleStyle = styled.div`
  display: inline;
  position: absolute;
  /* Extra small devices (phones, 600px and down) */
  @media only screen and (max-width: 600px) {
    float: right;
  }
  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 600px) {
    padding: 0 0 0 10px;
  }
`;

const Layout = ({ location, title, children }) => {
  const [theme, setTheme] = useState(null);
  const rootPath = `${__PATH_PREFIX__}/`;
  const aboutPath = `${__PATH_PREFIX__}/about/`;
  const projectsPath = `${__PATH_PREFIX__}/projects/`;
  const isRoot =
    location.pathname === rootPath ||
    location.pathname === aboutPath ||
    location.pathname === projectsPath;

  useEffect(() => {
    setTheme(window.__theme);
    window.__onThemeChange = () => setTheme(window.__theme);
  }, []);

  return (
    <LayoutStyle isRoot={isRoot}>
      <GlobalStyles />
      <ToggleStyle>
        <Toggle checked={theme === "dark"} />
      </ToggleStyle>
      {isRoot ? (
        <Sidebar location={location} theme={theme} isRoot={isRoot} />
      ) : (
        <div />
      )}
      <BodyStyle>
        <Header title={title} isRoot={isRoot} location={location} />
        <main>{children}</main>
      </BodyStyle>
    </LayoutStyle>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
