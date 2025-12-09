import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId, generateToken } from '$lib/server/utils';

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const costMin = data.get('costMin');
		const costMax = data.get('costMax');
		const randomSeed = data.get('randomSeed');

		const exchangeId = generateId();
		const adminToken = generateToken();
		const viewToken = generateToken();

		const costMinNum = costMin ? parseInt(costMin.toString()) : null;
		const costMaxNum = costMax ? parseInt(costMax.toString()) : null;

		if (costMinNum !== null && costMaxNum !== null && costMinNum > costMaxNum) {
			return { error: 'Minimum cost cannot be greater than maximum cost' };
		}

		await db.insert(table.exchanges).values({
			id: exchangeId,
			adminToken,
			viewToken,
			costMin: costMinNum,
			costMax: costMaxNum,
			randomSeed: randomSeed ? randomSeed.toString() : null,
			isGenerated: false,
			createdAt: new Date()
		});

		redirect(303, `/exchange/${adminToken}`);
	}
} satisfies Actions;
