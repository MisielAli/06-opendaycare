# OpenDaycare

Daycare-center app with staff and family/parent sides. Built with Next.js App Router.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Stack

- Next.js 16.3.1 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Fonts: Fredoka + Nunito via `next/font/google`

## Scripts

- `npm run dev` — start the dev server with Turbopack
- `npm run lint` — run ESLint
- `npx tsc --noEmit` — run the TypeScript type checker

## Project structure

- `app/` — Next.js App Router pages and layouts
- `app/(staff)/` — staff-side layout and pages (home feed, children, notices, account)
- `app/lib/` — static data and shared UI labels
- `components/` — React components organized by domain
  - `components/shared/` — reusable across screens
  - `components/sidebar/` — navigation sidebar
  - `components/feed/` — feed-specific components
- `references/pantallas/` — design mockups (UI source of truth)
- `references/screenshots/` — reference captures
- `specs/` — feature specs

## Implemented features

- `specs/01-feed-home.md` — staff home feed with static posts, sidebar and responsive mobile menu.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
