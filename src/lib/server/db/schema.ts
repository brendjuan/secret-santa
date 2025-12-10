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
	email: text('email'),
	passwordHash: text('password_hash').notNull(),
	assignedTo: text('assigned_to').references(() => participants.id),
	personalToken: text('personal_token').unique(),
	urlKey: text('url_key').unique() // Plain text key for URLs
});

export const forcedRelationships = pgTable('forced_relationships', {
	id: text('id').primaryKey(),
	exchangeId: text('exchange_id')
		.notNull()
		.references(() => exchanges.id, { onDelete: 'cascade' }),
	giverId: text('giver_id')
		.notNull()
		.references(() => participants.id, { onDelete: 'cascade' }),
	receiverId: text('receiver_id')
		.notNull()
		.references(() => participants.id, { onDelete: 'cascade' }),
	relationshipType: text('relationship_type').notNull().default('force') // 'force' or 'avoid'
});

export type Exchange = typeof exchanges.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type ForcedRelationship = typeof forcedRelationships.$inferSelect;
export type NewExchange = typeof exchanges.$inferInsert;
export type NewParticipant = typeof participants.$inferInsert;
export type NewForcedRelationship = typeof forcedRelationships.$inferInsert;
