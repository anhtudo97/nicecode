# nicecode

A Bun monorepo workspace for building terminal UI (TUI) applications with [OpenTUI](https://github.com/sst/opentui) and React.

## Requirements

- [Bun](https://bun.sh/) 1.3.0 or later

## Structure

```
nicecode/
└── packages/
    └── cli/       # OpenTUI + React terminal application
```

## Getting Started

Install dependencies from the repo root:

```bash
bun install
```

Run the CLI app in development mode:

```bash
cd packages/cli
bun dev
```

Typecheck the CLI app:

```bash
cd packages/cli
bun run typecheck
```

## Packages

- **[cli](packages/cli)** — Terminal UI app built with `@opentui/react`, created via `bun create tui`.
