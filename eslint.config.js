import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Contrast accessibility: warn when using low-contrast text colors on dark backgrounds
      // See src/docs/DESIGN_SYSTEM.md for guidelines
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/text-gray-500/]",
          message: "⚠️ Contrast issue: text-gray-500 has insufficient contrast on dark backgrounds. Use text-theme-text-muted or text-gray-400 instead. See src/docs/DESIGN_SYSTEM.md"
        },
        {
          selector: "Literal[value=/text-gray-600/]",
          message: "⚠️ Contrast issue: text-gray-600 has insufficient contrast on dark backgrounds. Use text-theme-text-muted instead. See src/docs/DESIGN_SYSTEM.md"
        },
        {
          selector: "Literal[value=/text-gray-700/]",
          message: "⚠️ Contrast issue: text-gray-700 is nearly invisible on dark backgrounds. Use text-theme-text-muted instead. See src/docs/DESIGN_SYSTEM.md"
        }
      ],
    },
  },
);
