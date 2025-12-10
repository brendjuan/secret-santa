ALTER TABLE "participants" ADD COLUMN "url_key" text;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_url_key_unique" UNIQUE("url_key");