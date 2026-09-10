import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      ".npm-cache/**",
      "next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
    ],
  },
];
export default config;
