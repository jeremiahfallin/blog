export const COLORS = {
  text: {
    light: "hsl(0deg, 0%, 10%)", // white
    dark: "hsl(0deg, 0%, 90%)", // near-black
  },
  background: {
    light: "hsl(0deg, 0%, 95%)", // white
    dark: "hsl(0deg, 0%, 11%)", // dark gray
  },
  primary: {
    light: "hsl(168deg, 99%, 18%)", // Dark green
    dark: "hsl(168deg, 99%, 36%)", // Light green
  },
  secondary: {
    light: "hsl(250deg, 100%, 50%)", // Purplish-blue
    dark: "hsl(190deg, 100%, 40%)", // Cyan
  },
  // Grays, scaling from least-noticeable to most-noticeable
  gray300: {
    light: "hsl(0deg, 0%, 70%)",
    dark: "hsl(0deg, 0%, 30%)",
  },
  gray500: {
    light: "hsl(0deg, 0%, 50%)",
    dark: "hsl(0deg, 0%, 50%)",
  },
  gray700: {
    light: "hsl(0deg, 0%, 30%)",
    dark: "hsl(0deg, 0%, 70%)",
  },
};

export const COLOR_MODE_KEY = "color-mode";
export const INITIAL_COLOR_MODE_CSS_PROP = "--initial-color-mode";
