import globals from "globals";

export default [
  {
    files: ["tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-var": "error",
      "prefer-const": "warn",
      eqeqeq: ["error", "smart"],
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    ignores: ["node_modules/**", "graphify-out/**", "data/**", "docs/**", "codex/**"]
  }
];
