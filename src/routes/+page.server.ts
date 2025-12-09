import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId, generateToken, generateSlug } from '$lib/server/utils';

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const theme = data.get('theme');
		const costMax = data.get('costMax');
		const randomSeed = data.get('randomSeed');

		if (!name || name.toString().trim() === '') {
			return { error: 'Exchange name is required' };
		}

		const exchangeId = generateId();
		const adminToken = generateToken();
		const viewToken = generateToken();
		const slug = generateSlug(name.toString());

		const costMaxNum = costMax ? parseInt(costMax.toString()) : null;

		await db.insert(table.exchanges).values({
			id: exchangeId,
			name: name.toString(),
			slug,
			adminToken,
			viewToken,
			theme: theme && theme.toString().trim() !== '' ? theme.toString() : null,
			costMax: costMaxNum,
			randomSeed: randomSeed ? randomSeed.toString() : null,
			isGenerated: false,
			createdAt: new Date()
		});

		redirect(303, `/exchange/${adminToken}`);
	}
} satisfies Actions;
