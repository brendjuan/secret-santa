<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
		<h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Secret Santa</h1>
		<p class="text-center text-gray-600 mb-8">Create a new gift exchange</p>

		<form method="POST" action="?/create" use:enhance>
			<div class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
						Exchange Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						placeholder="e.g., Christmas 2025"
					/>
				</div>

				<div>
					<label for="theme" class="block text-sm font-medium text-gray-700 mb-1">
						Theme (optional)
					</label>
					<input
						type="text"
						id="theme"
						name="theme"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						placeholder="e.g., Funny gifts, Homemade items"
					/>
				</div>

				<div>
					<label for="costMax" class="block text-sm font-medium text-gray-700 mb-1">
						Maximum Cost (optional)
					</label>
					<input
						type="number"
						id="costMax"
						name="costMax"
						min="0"
						step="1"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						placeholder="e.g., 50"
					/>
				</div>

				<div>
					<label for="randomSeed" class="block text-sm font-medium text-gray-700 mb-1">
						Random Seed (optional)
					</label>
					<input
						type="text"
						id="randomSeed"
						name="randomSeed"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						placeholder="For reproducible assignments"
					/>
					<p class="mt-1 text-xs text-gray-500">
						Same seed = same assignments (useful for testing)
					</p>
				</div>

				{#if form?.error}
					<div class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
						{form.error}
					</div>
				{/if}

				<button
					type="submit"
					class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
				>
					Create Exchange
				</button>
			</div>
		</form>
	</div>
</div>
