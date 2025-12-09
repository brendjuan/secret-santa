import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/utils';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	const [exchange] = await db
		.select()
		.from(table.exchanges)
		.where(eq(table.exchanges.slug, slug));

	if (!exchange) {
		error(404, 'Exchange not found');
	}

	const participants = await db
		.select({
			id: table.participants.id,
			name: table.participants.name
		})
		.from(table.participants)
		.where(eq(table.participants.exchangeId, exchange.id));

	return {
		exchange: {
			name: exchange.name,
			theme: exchange.theme,
			costMax: exchange.costMax,
			isGenerated: exchange.isGenerated
		},
		participants
	};
};

export const actions = {
	viewAssignment: async ({ request, params }) => {
		const { slug } = params;
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const password = data.get('password')?.toString();

		if (!name || !password) {
			return { error: 'Name and password are required' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.slug, slug));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (!exchange.isGenerated) {
			return { error: 'Assignments have not been generated yet' };
		}

		const [participant] = await db
			.select()
			.from(table.participants)
			.where(eq(table.participants.exchangeId, exchange.id));

		const allParticipants = await db
			.select()
			.from(table.participants)
			.where(eq(table.participants.exchangeId, exchange.id));

		const matchedParticipant = allParticipants.find(
			(p) => p.name.toLowerCase() === name.toLowerCase()
		);

		if (!matchedParticipant) {
			return { error: 'Participant not found' };
		}

		if (!verifyPassword(password, matchedParticipant.passwordHash)) {
			return { error: 'Invalid password' };
		}

		const assignedParticipant = allParticipants.find(
			(p) => p.id === matchedParticipant.assignedTo
		);

		if (!assignedParticipant) {
			return { error: 'No assignment found' };
		}

		return {
			success: true,
			assignedTo: assignedParticipant.name
		};
	}
} satisfies Actions;
