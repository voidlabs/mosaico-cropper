import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
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
        ...globals.browser,
        "jQuery": "readonly",
        "$": "readonly"
      }
    }
  }
];