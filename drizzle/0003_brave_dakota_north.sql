ALTER TABLE "participants" ADD COLUMN "personal_token" text;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_personal_token_unique" UNIQUE("personal_token");