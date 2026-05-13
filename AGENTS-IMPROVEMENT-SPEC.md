# AGENTS.md Improvement Specification

## 1. What's Good

- **Commands**: Clear npm scripts (dev, build, lint, test, clean)
- **Environment**: Lists required .env variables with examples
- **Architecture**: Explains Next.js 15, App Router, Supabase, Tailwind 4
- **Database**: Step-by-step SQL setup instructions (1-3 order)
- **Learning Entries**: Captures project-specific patterns (form accessibility)
- **Debugging**: Documents `lib/debug.ts` usage
- **Git**: Specifies main branch, no experimental

## 2. What's Missing

### Skills/Rules
- No `.ona/skills/` directory
- No `.cursor/rules/` directory
- No task-specific agent instructions (e.g., gacha, game state, UI components)

### Conventions
- No code style guide (beyond "follow existing patterns")
- No TypeScript conventions
- No component structure patterns
- No naming conventions

### Workflows
- No PR checklist
- No commit message format
- No code review guidelines
- No testing conventions

### Project-Specific
- No gacha system documentation
- No inventory system patterns
- No game state management patterns

## 3. What's Wrong

- **Git section (line ~24)**: Statement "no experimental branch exists" is static and will become outdated
- **No version tracking**: No instruction to update AGENTS.md when project structure changes

## 4. Recommended Improvements

### Add Skill Files
Create `.ona/skills/` with task-specific instructions:
- `gacha.md` — Gacha system patterns, RPC calls, rates
- `inventory.md` — Inventory management, item types
- `game-state.md` — State debugging, sync patterns
- `ui-components.md` — Reusable component usage

### Add Workflows
- PR template checklist
- Commit message format: `type: description` (feat, fix, refactor, test)
- Code review checklist

### Add Conventions
- TypeScript strict mode usage
- Component file structure (`components/views/*.tsx`)
- Supabase client initialization pattern

### Make Dynamic
- Add note: "Update this file when architecture changes"
- Add "Last reviewed" date

## 5. Priority Actions

1. **High**: Create skill files for gacha and game state (most complex systems)
2. **Medium**: Add PR/commit conventions
3. **Low**: Add code style guide

---

*Generated: 2026-05-13*