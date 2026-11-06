import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // App code logs through lib/log.ts so production consoles stay clean.
  { rules: { "no-console": "error" } },
  // CLI scripts (seed, assets, screenshots, portfolio) print progress to the terminal.
  { files: ["scripts/**", "portfolio/**"], rules: { "no-console": "off" } },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
