import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  underwriters,
  retailers,
  plans,
} from "../src/db/schema";

const UNDERWRITERS = [
  {
    name: "Britam Insurance Company Limited",
    iraLicense: "IRA/01/2025/00147",
    commissionBps: 1500,
  },
  {
    name: "APA Insurance Limited",
    iraLicense: "IRA/01/2025/00023",
    commissionBps: 1500,
  },
];

const RETAILERS = [
  {
    name: "Nairobi Electronics Hub",
    slug: "nairobi-electronics",
    contactEmail: "partners@nairobi-electronics.example",
    revenueShareBps: 2500,
  },
  {
    name: "Mombasa Phones Ltd",
    slug: "mombasa-phones",
    contactEmail: "warranty@mombasa-phones.example",
    revenueShareBps: 3000,
  },
];

// Price in KES as a percentage of retail price (bps). 1000 bps = 10%.
const PLANS = [
  {
    code: "SMART-12",
    name: "Smartphone - 12 months",
    productKind: "smartphone",
    termMonths: 12,
    priceBps: 1000,
    claimLimitKes: 60000,
    deductibleKes: 3000,
    coversAdp: true,
    coversMechanical: true,
  },
  {
    code: "SMART-24",
    name: "Smartphone - 24 months",
    productKind: "smartphone",
    termMonths: 24,
    priceBps: 1750,
    claimLimitKes: 60000,
    deductibleKes: 3000,
    coversAdp: true,
    coversMechanical: true,
  },
  {
    code: "LAP-12",
    name: "Laptop - 12 months",
    productKind: "laptop",
    termMonths: 12,
    priceBps: 900,
    claimLimitKes: 120000,
    deductibleKes: 5000,
    coversAdp: true,
    coversMechanical: true,
  },
  {
    code: "TV-12",
    name: "TV - 12 months",
    productKind: "tv",
    termMonths: 12,
    priceBps: 800,
    claimLimitKes: 80000,
    deductibleKes: 4000,
    coversAdp: false,
    coversMechanical: true,
  },
  {
    code: "APP-12",
    name: "Major appliance - 12 months",
    productKind: "appliance_major",
    termMonths: 12,
    priceBps: 750,
    claimLimitKes: 150000,
    deductibleKes: 2500,
    coversAdp: false,
    coversMechanical: true,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database");
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  const db = drizzle({ client });

  try {
    const existing = await db
      .select({ id: underwriters.id })
      .from(underwriters)
      .limit(1);
    if (existing.length > 0) {
      console.log("Seed data already present; skipping.");
      return;
    }

    const insertedUnderwriters = await db
      .insert(underwriters)
      .values(UNDERWRITERS)
      .returning();
    const insertedRetailers = await db
      .insert(retailers)
      .values(RETAILERS)
      .returning();

    const planRows = PLANS.map((plan, index) => ({
      ...plan,
      underwriterId: insertedUnderwriters[index % insertedUnderwriters.length].id,
    }));
    await db.insert(plans).values(planRows);

    console.log(
      `Seeded ${insertedUnderwriters.length} underwriters, ` +
        `${insertedRetailers.length} retailers and ${planRows.length} plans.`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
