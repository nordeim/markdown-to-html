// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // Global ignores — build artifacts, vendored content, and large reference docs
  // that should not be linted as project source.
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "docs/source_SKILL.md",
      "docs/markdown-html-pipeline_SKILL.md",
      "docs/Project_Architecture_Document.md",
      "docs/prompt-to-improve.md",
      "docs/audit/**",
      "docs/status.md",
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (untyped — does not require projectService)
  ...tseslint.configs.recommended,

  // React hooks rules — required for sound React code
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
    },
  },

  // JSX accessibility rules — required by the WCAG 2.2 AA gate
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },

  // Project-specific rule layers
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        IntersectionObserver: "readonly",
        matchMedia: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLInputElement: "readonly",
        HTMLElement: "readonly",
        Node: "readonly",
        MutationObserver: "readonly",
        fetch: "readonly",
        URL: "readonly",
        location: "readonly",
        history: "readonly",
        AbortController: "readonly",
      },
    },
    rules: {
      // Zero-warning policy: unused identifiers are errors, with conventional
      // underscore-prefix escape hatch for intentionally unused params.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Enforce `import type` for type-only imports (matches CLAUDE.md guidance)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // No explicit any — use unknown instead (matches CLAUDE.md)
      "@typescript-eslint/no-explicit-any": "error",
      // Enforce React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },

  // Test files get targeted relaxations for assertions and dev-only patterns
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "jsx-a11y/no-autofocus": "off",
    },
  },

  // Config files (vite, vitest, playwright) — TypeScript but not part of the app
  {
    files: ["*.config.{ts,js,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
