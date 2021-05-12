import React from "react";
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

  @media only screen and (min-width: 800px) {
    grid-template-columns: 1fr min(65ch, 100%) 1fr;
  }

  grid-column-gap: 32px;
`;

const ToggleStyle = styled.div`
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

const StyledMain = styled.main`
  display: grid;
  > * {
    grid-column: 2;
  }
`;

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const aboutPath = `${__PATH_PREFIX__}/about/`;
  const projectsPath = `${__PATH_PREFIX__}/projects/`;
  const isRoot =
    location.pathname === rootPath ||
    location.pathname === aboutPath ||
    location.pathname === projectsPath;

  return (
    <LayoutStyle isRoot={isRoot}>
      <GlobalStyles />
      <ToggleStyle>
        <Toggle />
      </ToggleStyle>
      {isRoot ? <Sidebar location={location} isRoot={isRoot} /> : <div />}
      <StyledMain>
        <Header title={title} isRoot={isRoot} location={location} />
        {children}
      </StyledMain>
    </LayoutStyle>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
