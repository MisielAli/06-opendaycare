<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Next.js local docs

- `node_modules/` is ignored by Git, so Glob may omit its contents. Do not conclude that Next.js documentation is missing from a Glob result.
- Read `node_modules/next/dist/docs/index.md` and the relevant direct path under `node_modules/next/dist/docs/` before writing Next.js code. If a direct read fails, verify the directory with `Test-Path` before reporting it missing.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack)
- `npm run lint` — ESLint (`eslint-config-next`)
- `npx tsc --noEmit` — typecheck (no script defined; there is no test setup either)

## Stack

- Next.js **16.3.1** App Router (`app/`), React 19, TypeScript, Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.*`; config lives in `app/globals.css`)
- Do not trust Next.js knowledge from training data — check `node_modules/next/dist/docs/` first (e.g. layouts use the new global `LayoutProps<"/">` type)

## Product context

- "Open Daycare": daycare-center app with staff and family/parent sides (feed of posts, child profiles, daily summaries)
- `references/pantallas/*.dc.html` — design mockups (Spanish) that define the screens to build; `references/screenshots/` — reference captures. Treat these as the UI source of truth.

## Spec workflow

- Large features go through the `/spec` → `/spec-impl` skills in `.agents/skills/` before coding
- Specs live in `specs/NN-slug.md`; `/spec-impl` requires state `Approved` and creates a `spec-NN-slug` branch
- When a spec is already implemented, use `/spec-verifier specs/NN-slug.md` to validate acceptance criteria, capture screenshots and mark the spec as done

## Implemented specs

- `specs/01-feed-home.md` — Feed as home `/`, static data, sidebar, responsive

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp
- Context7: usaremos este MCP para traer la documentación actualizada del Framework
- Supabase: use the Supabase MCP for project inspection, documentation, SQL, migrations, logs, Edge Functions, generated types, and security/performance advisors

## Supabase

- Load `.agents/skills/supabase/SKILL.md` for any Supabase task, including Database, Auth, Storage, Realtime, Edge Functions, client/SSR integration, CLI/MCP usage, and debugging
- Before writing or changing SQL, schemas, migrations, RLS policies, indexes, triggers, functions, or other Postgres objects, also load `.agents/skills/supabase-postgres-best-practices/SKILL.md`
- Supabase changes frequently: check the current changelog and use the Supabase MCP `search_docs` tool before implementing features or diagnosing service errors
- Inspect the current remote schema before making database changes; use migrations for DDL and run security and performance advisors after schema changes
- Enable RLS on every table exposed through the Data API and never expose secret or `service_role` keys to browser code
- `../07-DBschema` is a design reference only. Its tables, columns, and relationships are not guaranteed to exist in the connected Supabase project
- The repository currently has no local `supabase/` CLI configuration or migrations. Do not assume a local Supabase stack is available
- `.env.example` documents `SUPABASE_DB_PASSWORD`; never read, print, or commit secret values from `.env`

## Installed skills

- `spec`: design large features and create specs before implementation
- `spec-impl`: implement an approved spec on its dedicated branch
- `supabase`: required for every Supabase-related task
- `supabase-postgres-best-practices`: required before Postgres schema, SQL, RLS, migration, performance, or database security work


## Reglas de codigo

- Usar codigo limpio, nombres  de funciones y variables en ingles.
