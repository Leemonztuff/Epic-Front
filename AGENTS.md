# AGENTS.md

## Commands
- `npm run dev` - Dev server (Next.js 15)
- `npm run build` - Production build (`output: standalone`)
- `npm run lint` - ESLint (extends `next`)
- `npm run test` - Jest tests (configured with next/jest)
- `npm run clean` - Clear Next.js cache

Test framework: Jest with @testing-library/react

## Environment
Create `.env.local` (see `.env.example`):
- `GEMINI_API_KEY` - Google Gemini API key
- `APP_URL` - Injected at runtime by AI Studio
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Architecture
- Next.js 15 App Router, single package (not monorepo)
- Path alias: `@/*` → `./` (tsconfig.json:22)
- Views: `components/views/*.tsx` — self-contained game screens
- Supabase: auth + database, RPC game logic in consolidated `supabase/` files
- Styling: Tailwind 4 via `@tailwindcss/postcss` (no tailwind.config.js)
- `motion` package transpiled in next.config.ts (line 23)

## Git
- **main** — primary branch (no `experimental` branch exists)

## Database
Run these in Supabase SQL Editor in order (after clearing existing tables):
1. `supabase/01-schema.sql` — Tables, constraints, indexes
2. `supabase/02-functions.sql` — RPCs & stored procedures
3. `supabase/04-seed.sql` — Initial game data

Use `supabase/00-cleanup.sql` for full reset before reinstalling.

See `supabase/README.md` for detailed setup instructions.

## 2025-05-15 - [Form Accessibility and Reusable Components]
##-**Learning:** Standard accessibility pattern for forms in this project requires linking `label` elements to `input` fields using `htmlFor` and `id` attributes. Using reusable UI components like `Button` ensures consistent UX patterns (like loading states) across the application.
-**Action:** Always check if a reusable component exists before implementing custom buttons for core flows, and ensure form fields are properly labeled for screen readers.

## Known Issues
- Onboarding falls back to demo mode if `rpc_initialize_player` RPC not deployed
- HMR disabled when `DISABLE_HMR=true` (AI Studio agent-edit mode, next.config.ts:27)

## Debugging
- `lib/debug.ts` exports `gameDebugger` for detailed game state logging
- Enable via: `gameDebugger.enable()` or use browser console with prefix `[GAME-STATE]`, `[INVENTORY]`, `[GACHA]`, etc.