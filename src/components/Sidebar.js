import React from "react";
import styled from "styled-components";

import Bio from "./Bio";

import Socials from "./Socials";
import Menu from "./Menu";

const SidebarStyle = styled.div`
  padding: 40px;
  display: grid;
  grid-auto-rows: min-content;
  height: 100vh;
  &:after {
    background: #202020;
    background: linear-gradient(
      to bottom,
      lighten(#202020, 77%) 0%,
      lighten(#202020, 77%) 48%,
      lighten(#202020, 100%) 100%
    );
    position: absolute;
    display: block;
    content: "";
    width: 1px;
    height: 540px;
    top: 30px;
    right: -10px;
    bottom: 0;
  }
`;

const SplitContainer = styled.div`
  display: grid;

  /* Extra small devices (phones, 600px and down) */
  @media only screen and (max-width: 600px) {
  }

  /* Small devices (portrait tablets and large phones, 600px and up) */
  @media only screen and (min-width: 600px) {
    grid-template-columns: 3fr 2fr;
  }
`;

const Sidebar = ({ location, theme, isRoot }) => {
  return (
    <>
      <SplitContainer /* For making the left half of container empty. */>
        <div />
        <SidebarStyle>
          {isRoot && (
            <>
              <Bio />
              <Menu />
              <Socials checked={theme === "dark"} />
            </>
          )}
        </SidebarStyle>
      </SplitContainer>
    </>
  );
};

export default Sidebar;
