import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const { participantId, token } = params;

	// Get participant with personal token
	const [participant] = await db
		.select()
		.from(table.participants)
		.where(eq(table.participants.id, participantId));

	if (!participant) {
		error(404, 'Participant not found');
	}

	// Get the exchange
	const [exchange] = await db
		.select()
		.from(table.exchanges)
		.where(eq(table.exchanges.id, participant.exchangeId));

	if (!exchange) {
		error(404, 'Exchange not found');
	}

	// Check if assignments have been generated
	if (!exchange.isGenerated) {
		return {
			participant,
			exchange,
			assignment: null,
			message: 'Assignments have not been generated yet. Please check back later.',
			isValidKey: false
		};
	}

	// If URL key matches, show assignment
	if (participant.urlKey && participant.urlKey === token) {
		// Get assigned participant
		let assignedParticipant = null;
		if (participant.assignedTo) {
			[assignedParticipant] = await db
				.select()
				.from(table.participants)
				.where(eq(table.participants.id, participant.assignedTo));
		}

		return {
			participant,
			exchange,
			assignment: assignedParticipant,
			isValidKey: true,
			viewUrl: `/view/${exchange.slug}`
		};
	}

	// Invalid token - redirect to general view page
	redirect(303, `/view/${exchange.slug}`);
};