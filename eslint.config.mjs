import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-config-next 16 ships eslint-plugin-react-hooks 7, whose
    // recommended set adds React Compiler diagnostics. This project does not
    // enable the compiler, and these four flag code that predates the Next 16
    // upgrade. They are off so the upgrade does not have to refactor
    // components; re-enable them one at a time as that code is reworked.
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // `next lint` only covered src/. `eslint .` also reaches scripts/, where
    // this file reads untyped TMDB API responses.
    files: ["scripts/fetch-movie-posters.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([
    // Defaults of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local tool output:
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
    ".netlify/**",
  ]),
]);

export default eslintConfig;
