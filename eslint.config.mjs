import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 exporte des configurations plates : on les importe
// directement. FlatCompat les relisait comme des .eslintrc et plantait.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "*.config.js",
    "*.config.mjs",
    // Repris de l'ancien .eslintignore, qu'ESLint 9 ne lit plus.
    "**/.yoyo/",
    "**/coverage/",
    "**/.env",
    "**/.env.local",
    "**/.env.development.local",
    "**/.env.test.local",
    "**/.env.production.local",
  ]),
]);
