import React from "react";
import { Link } from "gatsby";
import styled from "styled-components";

const HeaderOneStyle = styled.h1`
  font-family: Montserrat, sans-serif;
  margin-top: 0;
  margin-bottom: 0;
  margin-bottom: ${(props) => (props.isRoot ? `15px` : 0)};
  padding-top: 40px;

  /* @media only screen and (max-width: 650px) {
    font-size: var(--font-size);
  } */

  /* Small devices (portrait tablets and large phones, 600px and up) */
  /* @media only screen and (min-width: 650px) {
    font-size: calc(2em + 46 * ((75vw - 600px) / 800));
    padding-bottom: 40px;
  } */
`;

const Header = ({ location, title }) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const isRoot = location.pathname === rootPath;

  return (
    <HeaderOneStyle isRoot={isRoot}>
      <Link
        style={{
          boxShadow: "none",
          textDecoration: "none",
          color: `var(--color-primary)`,
          "--font-size": isRoot
            ? `calc(2em + 23 * ((75vw - 600px) / 800))`
            : `font-size: calc(3em + 46 * ((75vw - 600px) / 800));`,
        }}
        to={"/"}
      >
        {title}
      </Link>
    </HeaderOneStyle>
  );
};

export default Header;
