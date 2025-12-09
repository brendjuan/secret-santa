import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId, hashPassword } from '$lib/server/utils';

export const load: PageServerLoad = async ({ params }) => {
	const { adminToken } = params;

	const [exchange] = await db
		.select()
		.from(table.exchanges)
		.where(eq(table.exchanges.adminToken, adminToken));

	if (!exchange) {
		error(404, 'Exchange not found');
	}

	const participants = await db
		.select()
		.from(table.participants)
		.where(eq(table.participants.exchangeId, exchange.id));

	return {
		exchange,
		participants,
		viewUrl: `/view/${exchange.slug}`
	};
};

export const actions = {
	addParticipant: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const password = data.get('password')?.toString();

		if (!name || !password) {
			return { error: 'Name and password are required' };
		}

		if (password.length < 3) {
			return { error: 'Password must be at least 3 characters' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot add participants after assignments are generated' };
		}

		await db.insert(table.participants).values({
			id: generateId(),
			exchangeId: exchange.id,
			name,
			passwordHash: hashPassword(password),
			assignedTo: null
		});

		return { success: true };
	},

	removeParticipant: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const participantId = data.get('participantId')?.toString();

		if (!participantId) {
			return { error: 'Participant ID is required' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot remove participants after assignments are generated' };
		}

		await db
			.delete(table.participants)
			.where(eq(table.participants.id, participantId));

		return { success: true };
	},

	generateAssignments: async ({ params }) => {
		const { adminToken } = params;

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		const participants = await db
			.select()
			.from(table.participants)
			.where(eq(table.participants.exchangeId, exchange.id));

		if (participants.length < 2) {
			return { error: 'Need at least 2 participants to generate assignments' };
		}

		// Shuffle participants using Fisher-Yates algorithm
		const shuffled = [...participants];
		const seed = exchange.randomSeed ? hashSeed(exchange.randomSeed) : Math.random();
		let random = seededRandom(seed);

		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		// Create circular assignments (0->1, 1->2, ..., n-1->0)
		for (let i = 0; i < shuffled.length; i++) {
			const giver = shuffled[i];
			const receiver = shuffled[(i + 1) % shuffled.length];

			await db
				.update(table.participants)
				.set({ assignedTo: receiver.id })
				.where(eq(table.participants.id, giver.id));
		}

		await db
			.update(table.exchanges)
			.set({ isGenerated: true })
			.where(eq(table.exchanges.id, exchange.id));

		return { success: true };
	},

	regenerateAssignments: async ({ params }) => {
		const { adminToken } = params;

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		// Reset all assignments
		await db
			.update(table.participants)
			.set({ assignedTo: null })
			.where(eq(table.participants.exchangeId, exchange.id));

		await db
			.update(table.exchanges)
			.set({ isGenerated: false })
			.where(eq(table.exchanges.id, exchange.id));

		// Redirect to trigger regeneration
		redirect(303, `/exchange/${adminToken}`);
	},

	updatePassword: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const participantId = data.get('participantId')?.toString();
		const password = data.get('password')?.toString();

		if (!participantId || !password) {
			return { error: 'Participant ID and password are required' };
		}

		if (password.length < 3) {
			return { error: 'Password must be at least 3 characters' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot update passwords after assignments are generated' };
		}

		await db
			.update(table.participants)
			.set({ passwordHash: hashPassword(password) })
			.where(eq(table.participants.id, participantId));

		return { success: true };
	}
} satisfies Actions;

// Seeded random number generator
function hashSeed(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash = hash & hash;
	}
	return Math.abs(hash) / 2147483647;
}

function seededRandom(seed: number) {
	return function () {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
}
