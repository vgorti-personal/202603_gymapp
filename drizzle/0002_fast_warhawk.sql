CREATE TYPE "public"."template_selection_mode" AS ENUM('persistent', 'session_prompt');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "template_selection_mode" "template_selection_mode" DEFAULT 'persistent' NOT NULL;
--> statement-breakpoint
UPDATE "users"
SET "template_selection_mode" = 'session_prompt'
WHERE "slug" IN ('emily', 'guest');
