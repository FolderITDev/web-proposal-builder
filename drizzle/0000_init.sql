CREATE TYPE "public"."brand_logo" AS ENUM('monogram', 'orbit', 'facet', 'stack');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN', 'BRL', 'ARS');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('none', 'percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."line_unit" AS ENUM('hour', 'day', 'week', 'unit', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'sent', 'accepted', 'declined');--> statement-breakpoint
CREATE SEQUENCE "public"."proposal_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "proposal_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"service" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"unit" "line_unit" NOT NULL,
	"quantity_hundredths" integer NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	CONSTRAINT "line_items_quantity" CHECK ("proposal_line_items"."quantity_hundredths" > 0),
	CONSTRAINT "line_items_price" CHECK ("proposal_line_items"."unit_price_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "proposal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"due" text DEFAULT '' NOT NULL,
	"percent_bps" integer NOT NULL,
	CONSTRAINT "milestones_percent" CHECK ("proposal_milestones"."percent_bps" BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"owner_hash" text,
	"is_example" boolean DEFAULT false NOT NULL,
	"share_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"client_company" text NOT NULL,
	"client_contact_name" text DEFAULT '' NOT NULL,
	"client_email" text DEFAULT '' NOT NULL,
	"client_address" text DEFAULT '' NOT NULL,
	"client_notes" text DEFAULT '' NOT NULL,
	"project_name" text NOT NULL,
	"project_summary" text DEFAULT '' NOT NULL,
	"project_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" date,
	"duration_weeks" smallint,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"discount_type" "discount_type" DEFAULT 'none' NOT NULL,
	"discount_value" bigint DEFAULT 0 NOT NULL,
	"tax_rate_bps" integer DEFAULT 0 NOT NULL,
	"tax_label" text DEFAULT 'Tax' NOT NULL,
	"total_minor" bigint DEFAULT 0 NOT NULL,
	"payment_terms" text DEFAULT '' NOT NULL,
	"valid_until" date,
	"notes" text DEFAULT '' NOT NULL,
	"conditions" text DEFAULT '' NOT NULL,
	"brand_company_name" text NOT NULL,
	"brand_logo" "brand_logo" DEFAULT 'monogram' NOT NULL,
	"brand_color" text DEFAULT '#1c2a44' NOT NULL,
	"brand_email" text DEFAULT '' NOT NULL,
	"brand_phone" text DEFAULT '' NOT NULL,
	"brand_website" text DEFAULT '' NOT NULL,
	"brand_address" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_owner_or_example" CHECK (("proposals"."is_example" AND "proposals"."owner_hash" IS NULL) OR (NOT "proposals"."is_example" AND "proposals"."owner_hash" IS NOT NULL)),
	CONSTRAINT "proposals_tax_rate" CHECK ("proposals"."tax_rate_bps" BETWEEN 0 AND 5000),
	CONSTRAINT "proposals_brand_color" CHECK ("proposals"."brand_color" ~ '^#[0-9a-fA-F]{6}$')
);
--> statement-breakpoint
CREATE TABLE "proposal_scope_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"included" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_line_items" ADD CONSTRAINT "proposal_line_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_milestones" ADD CONSTRAINT "proposal_milestones_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_scope_items" ADD CONSTRAINT "proposal_scope_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "line_items_position_idx" ON "proposal_line_items" USING btree ("proposal_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "milestones_position_idx" ON "proposal_milestones" USING btree ("proposal_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_number_idx" ON "proposals" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_share_token_idx" ON "proposals" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "proposals_owner_updated_idx" ON "proposals" USING btree ("owner_hash","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "proposals_example_updated_idx" ON "proposals" USING btree ("is_example","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "scope_items_position_idx" ON "proposal_scope_items" USING btree ("proposal_id","position");