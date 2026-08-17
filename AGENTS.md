<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
- Specs live in `specs/NN-slug.md` (folder may not exist yet for spec 01); `/spec-impl` requires state `Approved` and creates a `spec-NN-slug` branch

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp
- Context7 Usartemos este MCP para traer la documentacion actualizada del Framework
