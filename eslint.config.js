import tseslint from 'typescript-eslint';
import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  // TypeScript checks undefined names and permits function overload declarations.
  { files: ["**/*.ts"], languageOptions: { parser: tseslint.parser }, rules: { "no-undef": "off", "no-redeclare": "off" } },
  {
    rules: {
        "no-empty": "off",
        "no-constant-condition": "off",
        "no-prototype-builtins": "off",
        "no-unused-vars": "off",
        "no-useless-escape": "off"
    },
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        "jQuery": "readonly",
        "$": "readonly"
      }
    }
  }
];
