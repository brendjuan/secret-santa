CREATE TABLE "forced_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"exchange_id" text NOT NULL,
	"giver_id" text NOT NULL,
	"receiver_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "forced_relationships" ADD CONSTRAINT "forced_relationships_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forced_relationships" ADD CONSTRAINT "forced_relationships_giver_id_participants_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forced_relationships" ADD CONSTRAINT "forced_relationships_receiver_id_participants_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;