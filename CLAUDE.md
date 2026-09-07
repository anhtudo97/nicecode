# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Early-stage Bun workspace monorepo for a terminal UI (TUI) app built with [OpenTUI](https://github.com/sst/opentui) + React 19. Currently one package: `packages/cli` (`@nicecode/cli`), whose entire app is [src/index.tsx](packages/cli/src/index.tsx).

Note the naming drift: repo dir is `nightcode`, root package is `nicecode`, workspace package is `@nicecode/cli`. Don't "fix" one without the others.

## Runtime & commands

Bun (>= 1.3.0) is both runtime and package manager — `bun.lock` is the lockfile. Do not introduce npm/yarn/pnpm commands or lockfiles.

```bash
bun install                 # from repo root; workspaces are hoisted here
bun run dev:cli             # root: watch-run the TUI
cd packages/cli && bun dev  # same thing from the package
cd packages/cli && bun run typecheck   # tsc --noEmit
```

- **No test framework is configured.** There is no test script, runner, or test file. If tests are needed, `bun test` is the natural fit — ask before adding a framework.
- **Lint is currently broken:** `eslint.config.mjs` imports `@eslint/js`, which is not in root `devDependencies`. `bunx eslint .` fails with `ERR_MODULE_NOT_FOUND`. Fix by adding `@eslint/js` before relying on lint. There is also no `lint` script — invoke `bunx eslint .` directly.
- `packages/cli` has **no** `tsconfig.json` of its own; `tsc` walks up and uses the root [tsconfig.json](tsconfig.json), which extends [tsconfig.base.json](tsconfig.base.json).

## OpenTUI JSX — the main gotcha

This is **not** react-dom. `jsxImportSource` is `@opentui/react` (set in [tsconfig.base.json](tsconfig.base.json#L8-L9) and repeated in the root tsconfig). Intrinsic elements are OpenTUI's terminal primitives — `<box>`, `<text>`, `<textarea>`, etc. — not HTML tags. `<div>`/`<span>`/`className` do not exist; layout is flexbox props (`flexGrow`, `alignItems`, `justifyContent`) passed directly to the components.

Entry point pattern: `createCliRenderer()` from `@opentui/core` (top-level `await`), then `createRoot(renderer).render(<App />)` from `@opentui/react`.

`eslint-plugin-react` is configured with `react.version: "detect"`, but its DOM-oriented rules assume web React — treat DOM-specific lint complaints skeptically here.

## TypeScript config notes

Strict mode with `noUncheckedIndexedAccess`, `noImplicitOverride`, and `noFallthroughCasesInSwitch` on. `verbatimModuleSyntax` is on — use `import type { ... }` for type-only imports or `tsc` will fail. `allowImportingTsExtensions` is on, `module: "Preserve"`, `moduleResolution: "bundler"`, `noEmit` (Bun runs sources directly; there is no build step).

## Style & commits

Prettier ([.prettierrc](.prettierrc)) — **no semicolons**, double quotes, 120 col, `trailingComma: "none"`, 2-space indent. `eslint-config-prettier` is last in the ESLint chain, so formatting is Prettier's job, not ESLint's.

Husky enforces [commitlint](commitlint.config.js) with `@commitlint/config-conventional` on `commit-msg`, so commits **must** be conventional (`feat:`, `fix:`, `chore:`, …). `.husky/pre-commit` is empty — nothing runs before commit.

Main branch is `master`.
