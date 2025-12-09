import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const exchanges = sqliteTable('exchanges', {
	id: text('id').primaryKey(),
	adminToken: text('admin_token').notNull().unique(),
	viewToken: text('view_token').notNull().unique(),
	costMin: integer('cost_min'),
	costMax: integer('cost_max'),
	randomSeed: text('random_seed'),
	isGenerated: integer('is_generated', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const participants = sqliteTable('participants', {
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
