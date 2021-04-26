import React from "react";
import { useStaticQuery, graphql } from "gatsby";

import Layout from "../components/Layout";
import styled from "styled-components";

const StyledAbout = styled.div`
  display: grid;
  grid-row-gap: 30px;
  width: 100%;
  @media only screen and (max-width: 900px) {
    grid-column: span 2;
  }
`;

const StyledDescription = styled.div`
  @media only screen and (max-width: 900px) {
    display: grid;
    grid-auto-flow: row;
    grid-row: span 2;
  }
`;

const About = ({ data, location }) => {
  const {
    // allFile: { edges },
    site: {
      siteMetadata: { title },
    },
  } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allFile(filter: { name: { eq: "profile-pic" } }) {
        edges {
          node {
            id
            childImageSharp {
              fixed(width: 300, height: 400, quality: 90) {
                ...GatsbyImageSharpFixed
                aspectRatio
              }
            }
          }
        }
      }
    }
  `);

  return (
    <Layout location={location} title={title}>
      <StyledAbout>
        <StyledDescription>
          <div>
            <p>Hey! My name is Jeremiah.</p>
            <p>
              I'm an aspiring web developer, currently focusing on making things
              with React. I started my web development journey with Wes Bos'{" "}
              <a href={"https://advancedreact.com/"}>Advanced React</a> course,
              and since then have worked with several different technologies
              including Next, Gatsby, GraphQL, Node, and Express.
            </p>
            <p>
              I've also spent many years working with children at a Boys & Girls
              Club and have had the chance to teach programming (among other
              things) as well as work on their company website.
            </p>
            <p>
              In my free time I enjoy watching movies (hence the movie review
              style of this website) as well as coding, hiking, and playing
              ultimate frisbee.
            </p>
            <p>
              If you want to work with me feel free to{" "}
              <a href={"mailto:jeremiah.fallin@gmail.com"}>send me an email</a>.
            </p>
          </div>
        </StyledDescription>
      </StyledAbout>
    </Layout>
  );
};

export default About;
