import React from "react";
import { graphql } from "gatsby";
import styled from "styled-components";

import Layout from "../components/Layout";
import SEO from "../components/SEO";

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 20px;
  grid-auto-flow: row;
`;

const StyledWebsiteDescription = styled.div`
  box-shadow: none;
  text-decoration: none;
`;

const ProjectsPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title;

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="Projects" />
      <section>
        <Container>
          <StyledWebsiteDescription>
            <p>
              This website! Created a React frontend using Gatsby and
              Styled-Components to display blog posts about movies as well as
              personalprojects with a focus on being responsive. All projects
              are available on my{" "}
              <a
                href={"https://github.com/jeremiahfallin"}
                style={{ textDecoration: "none" }}
              >
                github
              </a>
              .
            </p>
          </StyledWebsiteDescription>
          <div>
            <span>
              <a href={"https://bgcuv.netlify.app"}>
                Boys & Girls Club of the Umpqua Valley website redesign
              </a>{" "}
              <a href={"https://github.com/jeremiahfallin/bgcuv"}>(GitHub)</a>
            </span>
            <p>
              is a redesign of the{" "}
              <a href={"https://instagram.com/drawwithkristi"}>
                Boys & Girls Club of the Umpqua Valley website
              </a>
              . Made with React, Gatsby, <a href={"https://bulma.io/"}>Bulma</a>
              , and Netlify CMS. Allows admins to edit content and also has a
              page for board members to see files that require authentication
              with Netlify Identity.
            </p>
          </div>
          <div>
            <span>
              <a href={"https://dwk.design"}>Draw With Kristi Store</a>{" "}
              <a href={"https://github.com/jeremiahfallin/drawwithkristi"}>
                (GitHub)
              </a>
            </span>
            <p>
              is a mock website for{" "}
              <a href={"https://instagram.com/drawwithkristi"}>
                draw with kristi
              </a>
              , an illustrator who makes stickers. Uses React, the Stripe API
              (for handling of purchases), AWS Lambda functions (for pulling
              instagram feed and sending user to Stripe with their cart
              information).
            </p>
          </div>
          <div>
            <span>
              <a href={"https://villager.center"}>Villager Center</a>{" "}
              <a href={"https://github.com/jeremiahfallin/acnhff"}>(GitHub)</a>
            </span>
            <p>
              is a tool for narrowing down the 391 villagers in Animal Crossing:
              New Horizons down to 10 (the number that will fit on a player's
              island). It's hard to pick favorites and this tool was made to
              help. Uses React with a custom hook I wrote, useFavorite, that
              keeps track of what villagers have been picked over other
              villagers to come up with a top 10. Custom useFavorite hook is
              generic and could be used for other favorite finding websites
              written in React.
            </p>
          </div>
          <div>
            <span>
              <a href={"https://spotify-skip-delete.netlify.app"}>
                Spotify-Skip-Delete
              </a>{" "}
              <a href={"https://github.com/jeremiah/spotify-skip-delete"}>
                (GitHub)
              </a>
            </span>
            <p>
              is a tool to use in conjunction with Spotify. Discover Weekly and
              Release Radar are two playlists that Spotify creates for a user to
              discover new music. The music in these playlists is cycled out
              every week and there is no way to find a previous week's songs if
              you didn't store them anywhere. I always add these songs to one
              playlist which became much too large. This tool lets you select a
              playlist and when you're playing songs in that playlist you can
              either approve a song and have it added to another playlist or you
              can skip the song which will delete it. Useful for cutting down
              large playlists. Styling is not completed but app is functional.
            </p>
          </div>
          <div>
            <span>
              <a
                href={
                  "https://github.com/jeremiahfallin/MasonicLodgeMemberManagement"
                }
              >
                Masonic Member Manager
              </a>
            </span>
            <p>
              is a website made using React and Next.js to create, read, and
              update member information for several Masonic Lodges. The website
              features user authentication, a GraphQL (SQL backend) database
              accessed using Prisma, a search bar for specific members over
              several criteria, and styled using Styled-Components. Example is
              available at
            </p>
          </div>
          <div>
            <span>
              <a href={"https://github.com/jeremiahfallin/chasingChallenger"}>
                Chasing Challenger
              </a>
            </span>
            <p>
              was created to keep track of what is being played in the videogame
              League of Legends. Created using a Node backend that processes
              data obtained from the Riot Games API and displays it on a React
              frontend. Uses Styled-Components for styling.
            </p>
          </div>
        </Container>
      </section>
    </Layout>
  );
};

export default ProjectsPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
