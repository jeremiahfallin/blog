import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
import styled from "styled-components";

const StyledDiv = styled.div`
  display: block;
  float: left;
  margin-bottom: ${props => props.marginBottom};
`;

const Menu = () => {
  const {
    site: {
      siteMetadata: { menu },
    },
  } = useStaticQuery(graphql`
    query MenuQuery {
      site {
        siteMetadata {
          menu {
            label
            path
          }
        }
      }
    }
  `);

  return (
    <StyledDiv marginBottom={`15px`}>
      {menu.map(item => {
        return (
          <p key={item.path}>
            <strong>
              <Link
                to={item.path}
                style={{
                  boxShadow: "none",
                  textDecoration: "none",
                  color: `var(--accent)`,
                  padding: "8px",
                  margin: "-8px",
                }}
                activeStyle={{ textDecoration: "underline" }}
              >
                {item.label}
              </Link>
            </strong>
          </p>
        );
      })}
    </StyledDiv>
  );
};

export default Menu;
