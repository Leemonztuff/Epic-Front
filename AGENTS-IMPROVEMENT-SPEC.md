# AGENTS.md Improvement Specification

## Current State

The existing `AGENTS.md` (50 lines) provides baseline project information but lacks comprehensive agent guidance.

---

## What's Good

| Section | Notes |
|---------|-------|
| Commands | All npm scripts documented |
| Environment | All required env vars listed |
| Architecture | Key tech stack (Next.js 15, Supabase, Tailwind 4, motion) |
| Database | Clear SQL file ordering |
| Known Issues | Documents onboarding fallback & HMR issue |
| Debugging | gameDebugger usage explained |

---

## What's Missing

### Critical (Agent Operation)
1. **Code conventions** — no style guidelines, no TypeScript patterns
2. **Component patterns** — only "views" documented, no UI component patterns
3. **Before-commit checklist** — no lint/typecheck verification step documented
4. **Testing patterns** — Jest mentioned but no test conventions, no run options (--watch, --testPathPattern)

### Important (Project Clarity)
5. **File structure overview** — scattered, no single source of truth
6. **State management** — unclear how global state is handled
7. **API patterns** — Supabase RPC usage not documented
8. **Error handling** — no patterns for graceful failures

### Nice to Have
9. **Security best practices**
10. **Deployment instructions**
11. **Common troubleshooting guide**
12. **Code review checklist**

---

## What's Wrong

| Issue | Location | Fix |
|-------|----------|-----|
| Broken formatting | Line 40-42 `##-**Learning:` | Change to `###` or `-` |
| Contradiction with WORKFLOW.md | Line 28 | Git branch info conflicts (WORKFLOW says `experimental` exists) |
| Missing verification step | General | Document "always run lint after changes" |
| Incomplete test commands | Line 7 | Document `--watch` and `--testPathPattern` options |

---

## Improvement Spec

### 1. Fix Broken Formatting
- Line 40: `## 2025-05-15` → `### 2025-05-15`
- Lines 41-42: Fix markdown syntax

### 2. Resolve Branch Contradiction
- Remove line 28 ("no experimental branch exists")
- Add reference to WORKFLOW.md for branch strategy

### 3. Add Before-Commit Checklist
```
## Before Committing
- Run `npm run lint` — must pass
- Run `npm run build` — must succeed
- Run `npm run test` — must pass
- Check for console.log/debug code
```

### 4. Expand Test Commands
```
- `npm run test` — Run all tests
- `npm run test -- --watch` — Watch mode
- `npm run test -- --testPathPattern=<pattern>` — Run specific tests
```

### 5. Add Code Conventions Section
```
## Code Conventions
- Use functional components with hooks
- Prefer `const` over `let`
- Use `interface` for shapes, `type` for unions
- Use `@/*` path alias for imports
- Follow ESLint rules (extends `next`)
- No `console.log` in production code
```

### 6. Add Component Patterns Section
```
## Component Patterns
- **Views**: `components/views/*.tsx` — self-contained game screens
- **UI**: `components/ui/*.tsx` — reusable primitives (Button, Card, Modal)
- **Hooks**: `hooks/*.ts` — custom hooks in top-level `hooks/` folder
- **Services**: `lib/*.ts` — utilities and API clients
```

### 7. Add File Structure Overview
```
## File Structure
app/              # Next.js App Router pages
components/
  ui/             # Reusable UI components
  views/          # Game screen views
lib/              # Utilities, services, debug
hooks/            # Custom React hooks
supabase/         # SQL schema, functions, seeds
public/assets/    # Sprites, backgrounds, cards
```

### 8. Add Supabase RPC Patterns
```
## API Patterns (Supabase)
- All game logic via RPC (see `supabase/02-functions.sql`)
- Client calls through `lib/supabase.ts` helpers
- Handle errors gracefully with try/catch + user feedback
```

---

## Implementation Priority

| Priority | Items |
|----------|-------|
| **P0** (Fix) | Lines 28, 40-42 contradiction/format fixes |
| **P1** (Add) | Before-commit checklist, code conventions, test commands |
| **P2** (Add) | Component patterns, file structure, API patterns |
| **P3** (Nice) | Security, deployment, troubleshooting |

---

## Expected Result

After improvements, AGENTS.md should be ~120 lines with:
- Role/constraint framing for agents
- Complete command reference with options
- Code and component conventions
- Clear file organization
- Before-commit verification steps
- Matching WORKFLOW.md for branches