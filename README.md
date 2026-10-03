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
cp .env.example .env                      # root env
cp .env.example packages/database/.env    # Prisma reads DATABASE_URL from here
bun run db:up                             # start Postgres and wait until healthy
bun run db:generate                       # generate the Prisma client
```

Other DB commands:

```bash
bun run db:down    # stop the database (data kept in the nicecode-dev-data volume)
bun run db:reset   # stop and delete the volume (wipes all data)
```

Defaults are `postgres` / `postgres` on port `5432`; override with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (and keep `DATABASE_URL` in sync).

Run in development mode (from the repo root):

```bash
bun run dev:server   # API server
bun run dev:cli      # TUI
```

Typecheck all packages / generate the Prisma client:

```bash
bun run typecheck
bun run db:generate
```

## Packages

- **[cli](packages/cli)** — Terminal UI app built with `@opentui/react`, created via `bun create tui`.
- **[server](packages/server)** — Hono API server (`@nicecode/server`), its route types are consumed by the CLI via `hono/client`.
- **[shared](packages/shared)** — Shared Zod schemas and models (`@nicecode/shared`).
- **[database](packages/database)** — Prisma ORM contract, config and generated client (`@nicecode/database`). Needs `DATABASE_URL` in `packages/database/.env` (see Getting Started).
