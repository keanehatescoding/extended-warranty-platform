CREATE TYPE "public"."claim_kind" AS ENUM('adp', 'mechanical', 'theft', 'liquid');
--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('submitted', 'awaiting_evidence', 'approved', 'rejected', 'in_repair', 'resolved');
--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('pending_payment', 'active', 'lapsed', 'cancelled', 'expired', 'claimed');
--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('smartphone', 'laptop', 'tv', 'appliance_major', 'appliance_small', 'wearable', 'console', 'other');
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "underwriters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"ira_license" text NOT NULL,
	"commission_bps" integer DEFAULT 1500 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"contact_email" text,
	"revenue_share_bps" integer DEFAULT 2500 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"underwriter_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"product_kind" "product_kind" NOT NULL,
	"term_months" integer NOT NULL,
	"price_bps" integer NOT NULL,
	"claim_limit_kes" integer NOT NULL,
	"deductible_kes" integer DEFAULT 0 NOT NULL,
	"covers_adp" boolean DEFAULT true NOT NULL,
	"covers_mechanical" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"retailer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "policy_status" DEFAULT 'pending_payment' NOT NULL,
	"retailer_receipt" text NOT NULL,
	"product_kind" "product_kind" NOT NULL,
	"product_brand" text NOT NULL,
	"product_model" text NOT NULL,
	"product_serial" text NOT NULL,
	"retail_price_kes" integer NOT NULL,
	"purchased_on" date NOT NULL,
	"starts_on" date NOT NULL,
	"expires_on" date NOT NULL,
	"premium_kes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"kind" "claim_kind" NOT NULL,
	"status" "claim_status" DEFAULT 'submitted' NOT NULL,
	"incident_on" date NOT NULL,
	"description" text NOT NULL,
	"evidence_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"assessed_kes" integer,
	"deductible_kes" integer DEFAULT 0 NOT NULL,
	"payout_kes" integer,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_centres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"town" text NOT NULL,
	"phone" text NOT NULL,
	"handles" text[] DEFAULT '{}'::text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"centre_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cost_kes" integer,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"amount_kes" integer NOT NULL,
	"channel" text DEFAULT 'mpesa' NOT NULL,
	"external_ref" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_underwriter_id_underwriters_id_fk" FOREIGN KEY ("underwriter_id") REFERENCES "public"."underwriters"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_centre_id_repair_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."repair_centres"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));
--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "retailers_slug_idx" ON "retailers" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "policies_policy_number_idx" ON "policies" USING btree ("policy_number");
--> statement-breakpoint
CREATE INDEX "policies_user_idx" ON "policies" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "policies_serial_idx" ON "policies" USING btree ("product_serial");
--> statement-breakpoint
CREATE INDEX "claims_policy_idx" ON "claims" USING btree ("policy_id","created_at");
--> statement-breakpoint
CREATE INDEX "repair_jobs_claim_idx" ON "repair_jobs" USING btree ("claim_id");
--> statement-breakpoint
CREATE INDEX "payouts_claim_idx" ON "payouts" USING btree ("claim_id");
