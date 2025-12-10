import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId, hashPassword, generateToken, generateRandomPassword } from '$lib/server/utils';

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

	const forcedRelationships = await db
		.select()
		.from(table.forcedRelationships)
		.where(eq(table.forcedRelationships.exchangeId, exchange.id));

	return {
		exchange,
		participants,
		forcedRelationships,
		viewUrl: `/view/${exchange.slug}`
	};
};

export const actions = {
	addParticipant: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!name || !password) {
			return { error: 'Name and password are required' };
		}

		if (password.length < 3) {
			return { error: 'Password must be at least 3 characters' };
		}

		// Basic email validation if provided
		if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return { error: 'Please enter a valid email address' };
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
			email: email?.trim() || null,
			passwordHash: hashPassword(password),
			assignedTo: null,
			personalToken: generateToken(),
			urlKey: generateRandomPassword(12)
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

		const allRelationships = await db
			.select()
			.from(table.forcedRelationships)
			.where(eq(table.forcedRelationships.exchangeId, exchange.id));

		const forcedRelationships = allRelationships.filter(r => r.relationshipType === 'force');
		const avoidRelationships = allRelationships.filter(r => r.relationshipType === 'avoid');

		// Validate forced relationships don't create conflicts
		const forcedGivers = new Set(forcedRelationships.map(r => r.giverId));
		const forcedReceivers = new Set(forcedRelationships.map(r => r.receiverId));

		// Check for duplicate receivers (one person can't receive from multiple people)
		if (forcedReceivers.size !== forcedRelationships.length) {
			return { error: 'Forced relationships conflict: one person cannot receive gifts from multiple people' };
		}

		// Check for circular conflicts in forced relationships
		for (const rel of forcedRelationships) {
			const conflictingRel = forcedRelationships.find(r => r.giverId === rel.receiverId && r.receiverId === rel.giverId);
			if (conflictingRel) {
				return { error: 'Forced relationships conflict: circular dependency detected' };
			}
		}

		const assignments = new Map<string, string>();
		const availableReceivers = new Set(participants.map(p => p.id));
		const availableGivers = new Set(participants.map(p => p.id));

		// Apply forced relationships first
		for (const relationship of forcedRelationships) {
			assignments.set(relationship.giverId, relationship.receiverId);
			availableReceivers.delete(relationship.receiverId);
			availableGivers.delete(relationship.giverId);
		}

		// Generate assignments for remaining participants
		const remainingGivers = Array.from(availableGivers);
		const remainingReceivers = Array.from(availableReceivers);

		if (remainingGivers.length !== remainingReceivers.length) {
			return { error: 'Cannot generate valid assignments with current forced relationships' };
		}

		if (remainingGivers.length > 0) {
			// Shuffle remaining participants
			const seed = exchange.randomSeed ? hashSeed(exchange.randomSeed) : Math.random();
			let random = seededRandom(seed);

			// Shuffle receivers
			for (let i = remainingReceivers.length - 1; i > 0; i--) {
				const j = Math.floor(random() * (i + 1));
				[remainingReceivers[i], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[i]];
			}

			// Create avoid pairs set for quick lookup
			const avoidPairs = new Set(avoidRelationships.map(r => `${r.giverId}-${r.receiverId}`));

			// Try to create a valid assignment avoiding self-assignments and avoid relationships
			let attempts = 0;
			let validAssignment = false;

			while (!validAssignment && attempts < 100) {
				validAssignment = true;

				// Check if current assignment would create self-assignments or violate avoid relationships
				for (let i = 0; i < remainingGivers.length; i++) {
					const giverId = remainingGivers[i];
					const receiverId = remainingReceivers[i];

					// Check for self-assignment
					if (giverId === receiverId) {
						validAssignment = false;
						break;
					}

					// Check for avoid relationships
					if (avoidPairs.has(`${giverId}-${receiverId}`)) {
						validAssignment = false;
						break;
					}
				}

				if (!validAssignment) {
					// Shuffle again
					for (let k = remainingReceivers.length - 1; k > 0; k--) {
						const j = Math.floor(random() * (k + 1));
						[remainingReceivers[k], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[k]];
					}
				}
				attempts++;
			}

			if (!validAssignment) {
				return { error: 'Unable to generate valid assignments. Try different relationship constraints.' };
			}

			// Assign remaining participants
			for (let i = 0; i < remainingGivers.length; i++) {
				assignments.set(remainingGivers[i], remainingReceivers[i]);
			}
		}

		// Save all assignments to database
		for (const [giverId, receiverId] of assignments) {
			await db
				.update(table.participants)
				.set({ assignedTo: receiverId })
				.where(eq(table.participants.id, giverId));
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
	},

	addForcedRelationship: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const giverId = data.get('giverId')?.toString();
		const receiverId = data.get('receiverId')?.toString();
		const relationshipType = data.get('relationshipType')?.toString() || 'force';

		if (!giverId || !receiverId) {
			return { error: 'Both giver and receiver must be selected' };
		}

		if (giverId === receiverId) {
			return { error: 'A participant cannot be assigned to themselves' };
		}

		if (!['force', 'avoid'].includes(relationshipType)) {
			return { error: 'Invalid relationship type' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot add relationships after assignments are generated' };
		}

		// Check if this exact relationship already exists
		const existingRelationship = await db
			.select()
			.from(table.forcedRelationships)
			.where(
				and(
					eq(table.forcedRelationships.exchangeId, exchange.id),
					eq(table.forcedRelationships.giverId, giverId),
					eq(table.forcedRelationships.receiverId, receiverId),
					eq(table.forcedRelationships.relationshipType, relationshipType)
				)
			);

		if (existingRelationship.length > 0) {
			return { error: `This ${relationshipType} relationship already exists` };
		}

		// Check for conflicting relationships (can't have both force and avoid for same pair)
		const conflictingRelationship = await db
			.select()
			.from(table.forcedRelationships)
			.where(
				and(
					eq(table.forcedRelationships.exchangeId, exchange.id),
					eq(table.forcedRelationships.giverId, giverId),
					eq(table.forcedRelationships.receiverId, receiverId)
				)
			);

		if (conflictingRelationship.length > 0 && conflictingRelationship[0].relationshipType !== relationshipType) {
			return { error: `Cannot add ${relationshipType} relationship - conflicting ${conflictingRelationship[0].relationshipType} relationship exists` };
		}

		await db.insert(table.forcedRelationships).values({
			id: generateId(),
			exchangeId: exchange.id,
			giverId,
			receiverId,
			relationshipType
		});

		return { success: true };
	},

	removeForcedRelationship: async ({ request, params }) => {
		const { adminToken } = params;
		const data = await request.formData();
		const relationshipId = data.get('relationshipId')?.toString();

		if (!relationshipId) {
			return { error: 'Relationship ID is required' };
		}

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot remove forced relationships after assignments are generated' };
		}

		await db
			.delete(table.forcedRelationships)
			.where(eq(table.forcedRelationships.id, relationshipId));

		return { success: true };
	},

	generatePersonalTokens: async ({ params }) => {
		const { adminToken } = params;

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		// Get participants without personal tokens
		const participants = await db
			.select()
			.from(table.participants)
			.where(eq(table.participants.exchangeId, exchange.id));

		// Generate tokens for participants that don't have them
		for (const participant of participants) {
			if (!participant.personalToken) {
				await db
					.update(table.participants)
					.set({ personalToken: generateToken() })
					.where(eq(table.participants.id, participant.id));
			}
		}

		return { success: true };
	},

	randomizePasswords: async ({ params }) => {
		const { adminToken } = params;

		const [exchange] = await db
			.select()
			.from(table.exchanges)
			.where(eq(table.exchanges.adminToken, adminToken));

		if (!exchange) {
			error(404, 'Exchange not found');
		}

		if (exchange.isGenerated) {
			return { error: 'Cannot randomize passwords after assignments are generated' };
		}

		// Get all participants in this exchange
		const participants = await db
			.select()
			.from(table.participants)
			.where(eq(table.participants.exchangeId, exchange.id));

		// Update each participant with a new random password and URL key
		for (const participant of participants) {
			const newPassword = generateRandomPassword(10);
			const urlKey = generateRandomPassword(12); // Slightly longer for URLs
			await db
				.update(table.participants)
				.set({
					passwordHash: hashPassword(newPassword),
					urlKey: urlKey
				})
				.where(eq(table.participants.id, participant.id));
		}

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
