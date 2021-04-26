import React from "react";
import { Link } from "gatsby";
import styled from "styled-components";

const HeaderThreeStyle = styled.h3`
  font-family: Montserrat, sans-serif;
  margin-top: 0;
  margin-bottom: 0;
  margin-bottom: ${props => (props.isRoot ? `15px` : 0)};
  padding-top: 40px;

  @media only screen and (max-width: 650px) {
    font-size: calc(2em + 23 * ((75vw - 600px) / 800));
  }

  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 650px) {
    font-size: calc(2em + 46 * ((75vw - 600px) / 800));
    padding-bottom: 40px;
  }
`;

const HeaderOneStyle = styled.h1`
  font-family: Montserrat, sans-serif;
  margin-top: 0;
  margin-bottom: 0;
  margin-bottom: ${props => (props.isRoot ? `15px` : 0)};
  padding-top: 40px;

  @media only screen and (max-width: 650px) {
    font-size: calc(3em + 46 * ((75vw - 600px) / 800));
  }

  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 650px) {
    font-size: calc(2em + 46 * ((75vw - 600px) / 800));
  }
`;

const HeaderLink = ({ title, isRoot }) => {
  if (isRoot) {
    return (
      <HeaderOneStyle isRoot={isRoot}>
        <Link
          style={{
            boxShadow: "none",
            textDecoration: "none",
            color: `var(--accent)`,
          }}
          to={"/"}
        >
          {title}
        </Link>
      </HeaderOneStyle>
    );
  } else {
    return (
      <HeaderThreeStyle isRoot={isRoot}>
        <Link
          style={{
            boxShadow: "none",
            textDecoration: "none",
            color: `var(--accent)`,
          }}
          to={"/"}
        >
          {title}
        </Link>
      </HeaderThreeStyle>
    );
  }
};

const Header = ({ location, title }) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const isRoot = location.pathname === rootPath;

  return <HeaderLink title={title} isRoot={isRoot} />;
};

export default Header;
