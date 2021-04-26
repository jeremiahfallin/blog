import React from "react";
import styled from "styled-components";
import { ThemeContext } from "./ThemeContext";
import sun from "../assets/sun.png";
import moon from "../assets/moon.png";

const StyledSun = styled.img`
  display: ${(props) => (props.isChecked ? "static" : "none")};
  filter: invert(46%) sepia(82%) saturate(850%) hue-rotate(126deg)
    brightness(95%) contrast(99%);
  height: 40px;
  height: 40px;
  cursor: pointer;
`;

const StyledMoon = styled.img`
  display: ${(props) => (props.isChecked ? "none" : "static")};
  filter: invert(10%) sepia(98%) saturate(5105%) hue-rotate(167deg)
    brightness(93%) contrast(99%);
  height: 40px;
  height: 40px;
  cursor: pointer;
`;

const Toggle = () => {
  const { colorMode, setColorMode } = React.useContext(ThemeContext);

  if (!colorMode) {
    return null;
  }

  return (
    <>
      <StyledSun
        src={sun}
        isChecked={colorMode === "dark"}
        onClick={() => setColorMode("light")}
      />
      <StyledMoon
        src={moon}
        isChecked={colorMode === "dark"}
        onClick={() => setColorMode("dark")}
      />
    </>
  );
};

export default Toggle;
