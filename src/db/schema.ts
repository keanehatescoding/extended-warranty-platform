import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productKindEnum = pgEnum("product_kind", [
  "smartphone",
  "laptop",
  "tv",
  "appliance_major",
  "appliance_small",
  "wearable",
  "console",
  "other",
]);
export const policyStatusEnum = pgEnum("policy_status", ["pending_payment", "active", "lapsed", "cancelled", "expired", "claimed"]);
export const claimStatusEnum = pgEnum("claim_status", [
  "submitted",
  "awaiting_evidence",
  "approved",
  "rejected",
  "in_repair",
  "resolved",
]);
export const claimKindEnum = pgEnum("claim_kind", ["adp", "mechanical", "theft", "liquid"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** The licensed insurer whose paper the policy sits on. Non-exclusive — one plan can be fronted by several. */
export const underwriters = pgTable("underwriters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ira_license: text("ira_license").notNull(),
  commissionBps: integer("commission_bps").notNull().default(1500),
  ...timestamps,
});

/** The retail chain selling the warranty at checkout. */
export const retailers = pgTable(
  "retailers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    contactEmail: text("contact_email"),
    revenueShareBps: integer("revenue_share_bps").notNull().default(2500),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("retailers_slug_idx").on(t.slug)],
);

/** A warranty plan — one line in the ratebook. */
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  underwriterId: uuid("underwriter_id")
    .notNull()
    .references(() => underwriters.id, { onDelete: "restrict" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  productKind: productKindEnum("product_kind").notNull(),
  termMonths: integer("term_months").notNull(),
  // Price in KES as a percentage of retail (bps). The ratebook lookup is kept in app code.
  priceBps: integer("price_bps").notNull(),
  // Caps and deductibles are in KES, kept per-plan.
  claimLimitKes: integer("claim_limit_kes").notNull(),
  deductibleKes: integer("deductible_kes").notNull().default(0),
  coversAdp: boolean("covers_adp").notNull().default(true),
  coversMechanical: boolean("covers_mechanical").notNull().default(true),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** The sold policy — the record attached to one serial-numbered device. */
export const policies = pgTable(
  "policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyNumber: text("policy_number").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "restrict" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    status: policyStatusEnum("status").notNull().default("pending_payment"),
    // Receipt/invoice at the retailer. Used to tie the policy back to a sale.
    retailerReceipt: text("retailer_receipt").notNull(),
    productKind: productKindEnum("product_kind").notNull(),
    productBrand: text("product_brand").notNull(),
    productModel: text("product_model").notNull(),
    productSerial: text("product_serial").notNull(),
    retailPriceKes: integer("retail_price_kes").notNull(),
    purchasedOn: date("purchased_on", { mode: "string" }).notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    expiresOn: date("expires_on", { mode: "string" }).notNull(),
    premiumKes: integer("premium_kes").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("policies_policy_number_idx").on(t.policyNumber),
    index("policies_user_idx").on(t.userId),
    index("policies_serial_idx").on(t.productSerial),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policies.id, { onDelete: "restrict" }),
    kind: claimKindEnum("kind").notNull(),
    status: claimStatusEnum("status").notNull().default("submitted"),
    incidentOn: date("incident_on", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    evidenceUrls: text("evidence_urls").array().notNull().default(sql`'{}'::text[]`),
    assessedKes: integer("assessed_kes"),
    deductibleKes: integer("deductible_kes").notNull().default(0),
    payoutKes: integer("payout_kes"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("claims_policy_idx").on(t.policyId, t.createdAt)],
);

export const repairCentres = pgTable("repair_centres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  town: text("town").notNull(),
  phone: text("phone").notNull(),
  // Which product kinds this centre handles.
  handles: text("handles").array().notNull().default(sql`'{}'::text[]`),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const repairJobs = pgTable(
  "repair_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => repairCentres.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    costKes: integer("cost_kes"),
    notes: text("notes").notNull().default(""),
  },
  (t) => [index("repair_jobs_claim_idx").on(t.claimId)],
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "restrict" }),
    status: payoutStatusEnum("status").notNull().default("pending"),
    amountKes: integer("amount_kes").notNull(),
    channel: text("channel").notNull().default("mpesa"),
    externalRef: text("external_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("payouts_claim_idx").on(t.claimId)],
);

export const policyRelations = relations(policies, ({ one, many }) => ({
  user: one(users, { fields: [policies.userId], references: [users.id] }),
  retailer: one(retailers, { fields: [policies.retailerId], references: [retailers.id] }),
  plan: one(plans, { fields: [policies.planId], references: [plans.id] }),
  claims: many(claims),
}));

export const claimRelations = relations(claims, ({ one, many }) => ({
  policy: one(policies, { fields: [claims.policyId], references: [policies.id] }),
  repairs: many(repairJobs),
  payouts: many(payouts),
}));

export type Retailer = typeof retailers.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type RepairJob = typeof repairJobs.$inferSelect;
