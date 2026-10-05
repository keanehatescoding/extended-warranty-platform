# Independent extended-warranty / protection-plan platform

- **Concept:** A retailer-agnostic "warranty-as-a-service" layer that lets any electronics or appliance retailer offer a protection plan at checkout, without each retailer having to negotiate its own insurer relationship.
- **Origin:** Extend, Clyde, and Allstate Protection Plans (US) all provide this kind of API-based protection-plan infrastructure to retailers.
- **Evidence of demand:** Kenya's household-appliance and consumer-electronics market was projected by KNBS to grow 11.4% in 2025; over 40% of urban households now own a major appliance, a figure expected to pass 55% by 2027.
- **Kenya landscape:** In November 2025, Hotpoint partnered with Britam and MIC Global to launch embedded all-risk appliance insurance — reported explicitly as "the first initiative of its kind in Kenya." That confirms the category was genuinely absent until very recently, and it remains exclusive to Hotpoint's own outlets and e-commerce platform. The rest of the market — Jumia, independent phone and electronics shops, Badili's refurbished-phone buyers — still has no easy way to offer a plan like this. Notably, embedded-insurance infrastructure already exists in Kenya for other categories (Lami Technologies and Turaco both distribute insurance via API, as seen in the boda boda insurance space), which lowers the technical lift for a warranty-specific product built on a similar model.
- **Opportunity:** Extend the "first mover" proof-of-concept beyond one retailer to the long tail of smaller electronics sellers.
- **Target customers:** Mid-size electronics/appliance retailers and e-commerce platforms who want to offer protection plans without becoming an insurer themselves.
- **Revenue model:** Revenue share with an underwriting insurance partner on premiums sold, or a technology licensing fee charged to retailers.
- **Difficulty:** Medium–High — needs an underwriting insurance partner and regulatory (IRA) compliance, though partnering with an existing embedded-insurance infrastructure company (rather than becoming an insurer) meaningfully reduces this.
- **Scalability:** Medium — appliance/electronics retail patterns are broadly similar across East Africa.
- **Risks:** Underwriting risk sits with the insurance partner, but claims-handling quality determines trust in the brand; Hotpoint's head start with the largest retailer is a real competitive signal to watch.
- **MVP:** Partner with one mid-size electronics retailer (not Hotpoint) to pilot an opt-in protection-plan add-on at checkout, using an existing embedded-insurance API rather than building underwriting capability in-house.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app, matching the stack used in `odpc-compliance-saas`. The schema in `src/db/schema.ts` is the current source of truth for the data model; UI, auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance, see .env.example
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply them (migrator script not yet included — copy from odpc-compliance-saas)
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/globals.css`, `.gitignore`, `.env.example`

What is still a stub:
- `src/app/layout.tsx` + `src/app/page.tsx` — scaffold against the installed Next version (see `node_modules/next/dist/docs/`); the `odpc-compliance-saas` siblings are a working reference.
- Auth (sessions, password reset, email verify) — copy and adapt the `lib/session.ts`, `lib/password.ts`, `lib/email-verification.ts` set from `odpc-compliance-saas`.
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
- `scripts/migrate.ts`, `scripts/seed.ts` — not yet included; the `package.json` scripts expect them.
