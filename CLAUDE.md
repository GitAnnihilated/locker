# Locker — project brief for Claude

Locker is a production Next.js app for students (School and College/University),
with real users and a live production database. Read this before touching anything.

## Stack

- Next.js 15 App Router, TypeScript, Server Actions (no separate API routes for mutations)
- Prisma ORM over Supabase Postgres (`DATABASE_URL` = pooled/pgbouncer for runtime queries,
  `DIRECT_URL` = direct connection, required for `prisma db push`/migrate)
- NextAuth v5, Credentials-only (email + password), JWT sessions — no OAuth, no adapter
- Tailwind for styling, bcryptjs for password hashing, Resend for transactional email
- `npm run build` = `prisma generate && next build`; `npm run db:seed` = `tsx prisma/seed.ts` (idempotent upserts, safe to re-run anytime)

## Deployment — READ THIS FIRST

- Pushing to `main` triggers an auto-deploy on the user's host (confirm this is still true
  before assuming — verify by asking or checking for platform config, don't just assert it).
- **The database and the deployed app are two independent things that must stay in sync.**
  Running `prisma db push` changes the LIVE production database immediately — before any
  code deploy happens. If you migrate the schema in a way old deployed code depends on
  (e.g. drop/rename a column or table it still reads), **production breaks the instant you
  push the schema**, even though you haven't pushed code yet. This has actually happened in
  this project. The fix: get the compatible code committed and pushed to `main` promptly
  after (or ideally in the same breath as) any schema push — don't leave a schema/code gap
  open.
- Only ever run `prisma db push` for **additive** changes (new nullable/defaulted columns,
  new tables). Never drop columns/tables or make something newly required without asking
  first, explicitly naming the exact tables/columns, and getting a clear yes — auto-mode
  will otherwise block destructive DB ops until you do this anyway.
- There are real users and real data. Never run anything destructive without being asked,
  and even then, confirm in the specific wording the classifier expects (name the exact
  table/operation) before it will let you proceed.

## Established conventions — follow these, don't reinvent

- **Server Actions return `{ error: string } | <success shape>` instead of throwing** for
  any user-facing/expected error, via `handleActionError(e)` from `src/lib/actionError.ts`.
  This is because Next.js 15 production builds redact thrown Server Action error messages
  down to a generic string — the client needs the real text. Genuinely unexpected bugs can
  still throw (fine to be redacted, since a bug isn't a user-facing message).
- **"Config data, not code" for anything with a growing catalog.** Rewards (Badge/Perk/
  LevelDef/PointAction rows, seeded in `prisma/seed.ts`, evaluated generically in
  `src/core/rewards/engine.ts`) and the School/College split (`src/core/education/config.ts`,
  `src/core/modules/registry.ts`'s `educationTypes` field) both follow this: adding a new
  badge/perk/module is a data insert or a registry entry, never a new `if` branch scattered
  through the app.
- **Module registry pattern** (`src/core/modules/registry.ts`): every top-level feature
  declares itself once (id/name/icon/href/description/enabled/optional `educationTypes`).
  Sidebar/MobileNav/Dashboard all just map over `enabledModules(educationType)`. Adding a
  module = new `src/modules/<name>/` + one registry entry, no changes to existing files.
- **Permission guards** live in `src/core/permissions/{rules,guards}.ts` — pure predicates
  in `rules.ts`, DB-backed guards in `guards.ts` that throw. Follow this split for any new
  authorization logic rather than inlining checks in actions.
- **Cosmetic perks** (name color, avatar frame, chat bubble) are applied via
  `src/core/rewards/cosmetics.ts`'s `cosmeticPerksSelect`/`withCosmetics`/`reduceCosmetics`
  — add these to any new query that selects a user for display, don't build a parallel
  mechanism.
- **School vs. College**: a Class doubles as a Course for College users (same table,
  `Class.courseCode` is the only extra field) — Assignments/Project Groups/Study Groups/
  Campus Marketplace all reuse Homework/Group/MarketplaceListing directly rather than
  parallel systems. `Group.kind` (PROJECT/STUDY) and `MarketplaceListing.category` are the
  only schema differentiators. Terminology and navigation differences are read from
  `core/education/config.ts`'s `getTerminology()`, never hardcoded per-string.
- **Windows environment**: shell is Git Bash via the Bash tool (POSIX-ish) or PowerShell —
  check which is active; don't assume Unix tools like `find`/`grep` exist reliably outside
  the dedicated Glob/Grep tools.

## Testing/verification standard expected on any nontrivial change

1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — must be clean.
3. For anything touching data: write a throwaway Node script (in `scripts/`, prefixed
   `_tmp_` or similar) that creates obviously-fake test users/data, exercises the actual
   action/query functions (or a real HTTP fetch with a minted NextAuth session cookie —
   see any recent session transcript for the pattern using `next-auth/jwt`'s `encode()`),
   asserts expected results, then **delete the test data and the scratch script** when done.
   Ask before creating test rows in the live DB if it's the first time in a session; once
   granted, that permission covers the rest of that session's testing.
4. For UI changes, a live check that the actual rendered HTML contains expected content —
   not just "no error thrown."

## What to ask before proceeding vs. what to just do

- **Just do it** (this user prefers action over asking): implementation approach, additive
  schema design, which files to touch, UI/copy details, reasonable scope-narrowing on a
  huge request (but *say* what you chose not to do, don't silently drop things).
- **Ask first**: anything destructive (drop/reset/delete data or tables), which specific
  test-data-creation permission to use for the session, and genuinely ambiguous product
  decisions with no reasonable default.
- **Report honestly, always**: if something's out of scope or simplified, say so explicitly
  in the final summary rather than letting it look finished. This user reads and acts on
  "remaining concerns" sections — they'll come back and ask for exactly those items fixed.

## Communication preferences

- Prefers real implementation over plans — "inspect first, then implement" not "here's what
  you should do."
- Wants a structured final report on large changes: files changed, schema changes, what was
  tested, what's still a known gap. Bullet/section format, not prose.
- Fine with large, many-file changes in one pass as long as each is verified before moving on.
- Commit messages should explain *why*, not just *what* — this codebase's own commit history
  and code comments are unusually explanatory; match that register.
