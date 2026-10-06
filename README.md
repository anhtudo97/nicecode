# nicecode

A Bun monorepo workspace for building terminal UI (TUI) applications with [OpenTUI](https://github.com/sst/opentui) and React.

## Requirements

- [Bun](https://bun.sh/) 1.3.0 or later
- [Docker](https://www.docker.com/) (for the local PostgreSQL database)

## Structure

```
nicecode/
├── docker/        # docker-compose for the local dev database
└── packages/
    ├── cli/       # OpenTUI + React terminal application
    ├── server/    # Hono API server
    ├── shared/    # Zod schemas / types shared by cli and server
    └── database/  # Prisma contract + DB client
```

## Getting Started

Install dependencies from the repo root:

```bash
bun install
```

Set up the database (PostgreSQL 17 in Docker, container and database both named `nicecode-dev`):

```bash
cp .env.example .env                      # root env — set DATABASE_URL (Prisma and the server both read it from here)
bun run db:up                             # start Postgres and wait until healthy
bun run db:generate                       # generate the Prisma client (output is committed)
```

Example `DATABASE_URL` for the default Docker setup: `postgresql://postgres:postgres@localhost:5432/nicecode-dev`.

Other DB commands:

```bash
bun run db:down    # stop the database (data kept in the nicecode-dev-data volume)
bun run db:reset   # stop and delete the volume (wipes all data)
```

Defaults are `postgres` / `postgres` on port `5432`; override with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (and keep `DATABASE_URL` in sync).

Run in development mode (from the repo root):

```bash
bun run dev:server   # API server on http://localhost:3000
bun run dev:cli      # TUI (set API_BASE_URL to point at another server)
```

The server must be running for the TUI to list/create sessions.

Quality checks (also run in CI):

```bash
bun run lint          # ESLint (lint:fix to autofix)
bun run format:check  # Prettier (format to write)
bun run typecheck     # tsc --noEmit in every package
```

Other: `bun run db:studio` opens Prisma Studio. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint via Husky).

## Packages

- **[cli](packages/cli)** — Terminal UI app built with `@opentui/react` and `react-router` (home, new session, session screens; themes, dialogs, toasts, command menu).
- **[server](packages/server)** — Hono API server (`@nicecode/server`) with `/session` routes and Sentry error/log reporting; its route types are consumed by the CLI via `hono/client`.
- **[shared](packages/shared)** — Shared Zod schemas and models (`@nicecode/shared`).
- **[database](packages/database)** — Prisma 7 schema (`Session`, `Message`), config and generated client (`@nicecode/database`). Needs `DATABASE_URL` in the root `.env` (see Getting Started).
