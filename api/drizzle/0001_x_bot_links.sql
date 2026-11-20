ALTER TABLE "sync_runs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "sync_runs" CASCADE;--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_source_external_id_unique";--> statement-breakpoint
UPDATE "templates" SET "external_id" = substring("template_url" from 'id=([A-Za-z0-9_-]+)') WHERE "external_id" IS NULL;--> statement-breakpoint
UPDATE "templates" AS t SET "external_id" = 'legacy-' || t."id" WHERE t."external_id" IS NULL OR EXISTS (SELECT 1 FROM "templates" AS o WHERE o."external_id" = t."external_id" AND o."id" < t."id");--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "template_url";--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "external_author";--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_external_id_unique" UNIQUE("external_id");--> statement-breakpoint
DROP TYPE "public"."sync_status";--> statement-breakpoint
DROP TYPE "public"."template_source";