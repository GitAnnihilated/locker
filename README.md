# 🔒 Locker

**The shared brain of a class.** One student gets a tidy homework checklist. A whole class gets an always-correct assignment board, a school marketplace, achievements, and a project-group finder.

Four modules, on purpose: **Homework · Marketplace · Achievements · Group Finder.**

---

## Why Locker grows

Locker is designed so **every extra classmate makes the product better for everyone already in it** — the definition of a network effect:

- **Homework** is useful solo (personal checklist) but becomes *reliable* only when the class contributes. The **coverage meter** makes missing classmates visible.
- **Marketplace** is school-scoped: more students = more liquidity. It's **gated at 3 classmates** so the incentive to invite is built into unlocking it.
- **Achievements** reward streaks and contributions → daily habit + shareable bragging rights.
- **Group Finder** is a pure network good — you can't form a group alone.

The invite code is one tap away at all times (`InviteCard` on the dashboard). Joining a class *requires* a code, so sharing is the only onboarding path → built-in virality.

---

## Tech stack (and why)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | One codebase for UI + API (Server Actions). RSC keeps JS light on student phones. Scales horizontally (stateless). |
| Language | **TypeScript (strict)** | Fewer runtime bugs; approachable for intermediate JS devs. |
| Database | **PostgreSQL** | Deeply relational data + `JSONB` flexibility. Scales via read replicas / partition-by-`schoolId`. |
| ORM | **Prisma** | Schema reads like documentation; type-safe; first-class migrations. |
| Auth | **Auth.js (NextAuth v5)** | Google + magic link. No password storage. |
| Validation | **Zod** | One schema for form + server action. |
| Styling | **Tailwind + in-house component library** | Fast, consistent, themeable via CSS variables. No heavy UI dependency. |

**The "5M users" test:** stateless app tier + `schoolId` on every tenant table (shard later) + isolated modules (extract a hot module into its own service without touching the rest). No decision here forces a rewrite at scale.

---

## Folder structure

```
src/
  app/                      # Next.js routes — THIN. Compose modules, no logic.
    (app)/                  #   authenticated shell (sidebar + header)
      dashboard/ homework/ marketplace/ achievements/ groups/ onboarding/
    login/  page.tsx        #   public landing + auth
    api/auth/[...nextauth]/ #   Auth.js handler
  core/                     # Cross-cutting foundations
    auth/                   #   Auth.js config + session guards
    db/                     #   Prisma singleton
    membership/             #   User↔Class context (shared by every module)
    modules/registry.ts     #   ⭐ the plug-in seam (nav/gates read from here)
  modules/                  # FEATURES — each fully isolated
    homework/  marketplace/  achievements/  groups/  invites/
      components/           #   feature UI
      actions.ts           #   Server Actions (the only mutation path)
      queries.ts           #   read models
      schema.ts            #   Zod validation
  ui/                       # Design system: tokens + reusable primitives
    components/  styles/
  lib/                      # Pure utilities (cn, format, ids)
  types/                    # Ambient type augmentation
prisma/
  schema.prisma  seed.ts
```

**How a future module plugs in** (Clubs, Timetable, Notes, Events, Lost & Found):
1. `mkdir src/modules/<name>/` with the same `components / actions / queries / schema` shape.
2. Add one entry to `src/core/modules/registry.ts`.
3. Add a route under `src/app/(app)/<name>/`.

No existing file changes. That isolation is the whole architecture.

---

## Data model highlights

`User → School → Class → Membership` is the core. Each module hangs its own tables off that core (`Homework`, `MarketplaceListing`, `Achievement`, `Group`, `Invite`). Future-proofing baked into every table: UUID PKs, `schoolId` for sharding, `createdAt/updatedAt/deletedAt`, and a `metadata Json?` escape hatch so new fields don't need migrations. Money is stored as **integer cents**, never floats. See `prisma/schema.prisma`.

---

## Development roadmap

- **Phase 0 — Foundation (this scaffold):** schema, auth, module registry, design system, Homework end-to-end, Marketplace/Achievements/Groups/Onboarding wired.
- **Phase 1 — Retention loop:** streak computation job, achievement auto-unlock triggers, class leaderboard, push/email nudges for due homework.
- **Phase 2 — Trust & virality:** verified-classmate flow, invite attribution analytics, share cards for achievements, class switcher.
- **Phase 3 — Realtime & scale:** live homework updates (Postgres LISTEN/NOTIFY or a realtime provider), image uploads for listings, read replicas, partition tenant tables by `schoolId`.
- **Phase 4 — Platform:** first plug-in module (Timetable or Events), teacher tools, mobile PWA polish, first monetization (school Pro / marketplace fees).

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env      # fill DATABASE_URL, AUTH_SECRET, Google creds

# 3. Database
npm run db:push           # create tables
npm run db:seed           # load starter achievements

# 4. Run
npm run dev               # http://localhost:3000
```

Requires Node 18+ and a PostgreSQL database (local, or a free Neon/Supabase instance).
