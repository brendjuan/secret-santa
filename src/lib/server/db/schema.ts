import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const exchanges = pgTable('exchanges', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	adminToken: text('admin_token').notNull().unique(),
	viewToken: text('view_token').notNull().unique(),
	theme: text('theme'),
	costMax: text('cost_max'),
	randomSeed: text('random_seed'),
	isGenerated: boolean('is_generated').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const participants = pgTable('participants', {
	id: text('id').primaryKey(),
	exchangeId: text('exchange_id')
		.notNull()
		.references(() => exchanges.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	passwordHash: text('password_hash').notNull(),
	assignedTo: text('assigned_to').references(() => participants.id)
});

export type Exchange = typeof exchanges.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type NewExchange = typeof exchanges.$inferInsert;
export type NewParticipant = typeof participants.$inferInsert;
