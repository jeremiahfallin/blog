import React, { useState } from "react";
import styled from "styled-components";
import { ThemeContext } from "./ThemeContext";
import useInterval from "./useInterval";
import mail from "../assets/mail.svg";
import linkedin from "../assets/linkedin.svg";
import github from "../assets/github.svg";
import twitter from "../assets/twitter.svg";

const StyledImage = styled.img`
  height: 20px;
  width: 20px;
  cursor: pointer;
  filter: ${(props) =>
    props.isDark
      ? `invert(46%) sepia(82%) saturate(850%) hue-rotate(126deg) brightness(95%) contrast(99%)`
      : `invert(10%) sepia(98%) saturate(5105%) hue-rotate(167deg) brightness(93%) contrast(99%)`};
`;

const Container = styled.div`
  float: right;
  display: block;
  a {
    box-shadow: none;
    margin: 0 0.1875rem;
  }
`;

const TooltipStyle = styled.div`
  /* Popup container - can be anything you want */
  position: relative;
  display: inline-block;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 14px;
  margin: 0 0.1875rem;

  /* The actual popup */
  .popuptext {
    visibility: ${(props) => (props.clicked ? `visible` : `hidden`)};
    width: 80px;
    background-color: #555;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 4px 0;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -40px;
  }

  /* Popup arrow */
  .popuptext::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #555 transparent transparent transparent;
  }

  /* Toggle this class - hide and show the popup */
  .show {
    visibility: ${(props) => (props.clicked ? `hidden` : `visible`)};
    -webkit-animation: fadeIn 1s;
    animation: fadeIn 1s;
  }

  /* Add animation (fade in the popup) */
  @-webkit-keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ShowTooltip = ({ clicked, setClicked }) => {
  useInterval(
    () => {
      setClicked(false);
    },
    clicked ? 1000 : null
  );

  return (
    clicked && (
      <span className="popuptext" id="myPopup">
        Copied!
      </span>
    )
  );
};

const Socials = () => {
  const [clicked, setClicked] = useState(false);
  const { colorMode } = React.useContext(ThemeContext);

  const copyToClipboard = (e) => {
    setClicked(true);
    let email = "jeremiah.fallin@gmail.com";
    navigator.clipboard
      .writeText(email)
      .then(() => {
        console.log("Copied!");
      })
      .catch((err) => {
        console.log("Something went wrong", err);
      });
  };

  const myFunction = (e) => {
    setClicked(true);
    let popup = document.getElementById("myPopup");
    if (popup) {
      popup.classList.toggle("show");
    }
  };

  return (
    <Container>
      <a href="https://github.com/jeremiahfallin">
        <StyledImage src={github} isDark={colorMode === "dark"} />
      </a>
      <a href="https://www.twitter.com/loltacit">
        <StyledImage src={twitter} isDark={colorMode === "dark"} />
      </a>
      <a href="https://www.linkedin.com/in/jeremiah-fallin-38084022/">
        <StyledImage src={linkedin} isDark={colorMode === "dark"} />
      </a>
      <TooltipStyle
        className="popup"
        clicked={clicked}
        onClick={(e) => myFunction(e)}
      >
        <StyledImage
          className="copied"
          data-clipboard-text={"https://github.com/jeremiahfallin"}
          src={mail}
          onClick={(e) => copyToClipboard(e)}
          isDark={colorMode === "dark"}
          value={"https://github.com/jeremiahfallin"}
        />
        <ShowTooltip clicked={clicked} setClicked={setClicked} />
      </TooltipStyle>
    </Container>
  );
};

export default Socials;
