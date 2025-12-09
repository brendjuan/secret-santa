-- Add missing columns to exchanges table
ALTER TABLE "exchanges" ADD COLUMN "name" text;
ALTER TABLE "exchanges" ADD COLUMN "slug" text;
ALTER TABLE "exchanges" ADD COLUMN "theme" text;

-- Make name NOT NULL (after adding it)
UPDATE "exchanges" SET "name" = 'Unnamed Exchange' WHERE "name" IS NULL;
ALTER TABLE "exchanges" ALTER COLUMN "name" SET NOT NULL;

-- Make slug NOT NULL and UNIQUE (after adding it)
-- Generate slugs for existing exchanges
UPDATE "exchanges" SET "slug" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6) WHERE "slug" IS NULL;
ALTER TABLE "exchanges" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_slug_unique" UNIQUE("slug");

-- Drop cost_min column if it exists
ALTER TABLE "exchanges" DROP COLUMN IF EXISTS "cost_min";
