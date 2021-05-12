import React from "react";
import styled from "styled-components";

import Bio from "./Bio";

import Socials from "./Socials";
import Menu from "./Menu";

const SidebarStyle = styled.div`
  display: grid;
  grid-column: 1;
  padding: 40px;
  grid-template-columns: repeat(3, 1fr);
  > * {
    grid-column: 2;
  }
`;

const Sidebar = ({ location, theme, isRoot }) => {
  return (
    <SidebarStyle>
      {isRoot && (
        <>
          <Bio />
          <Menu />
          <Socials />
        </>
      )}
    </SidebarStyle>
  );
};

export default Sidebar;
