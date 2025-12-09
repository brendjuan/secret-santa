<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showAssignment = $state(false);
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
		<h1 class="text-3xl font-bold text-center text-gray-800 mb-2">{data.exchange.name}</h1>
		<p class="text-center text-gray-600 mb-8">Secret Santa Exchange</p>

		<!-- Exchange Details -->
		{#if data.exchange.theme || data.exchange.costMax}
			<div class="mb-6 p-4 bg-gray-50 rounded-lg">
				{#if data.exchange.theme}
					<div class="mb-3">
						<h2 class="text-sm font-semibold text-gray-700 mb-1">Theme</h2>
						<p class="text-lg font-bold text-gray-800">
							{data.exchange.theme}
						</p>
					</div>
				{/if}
				{#if data.exchange.costMax}
					<div>
						<h2 class="text-sm font-semibold text-gray-700 mb-1">Maximum Gift Cost</h2>
						<p class="text-lg font-bold text-gray-800">
							${data.exchange.costMax}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Participants List -->
		<div class="mb-6">
			<h2 class="text-sm font-semibold text-gray-700 mb-2">Participants</h2>
			<div class="p-4 bg-gray-50 rounded-lg">
				<ul class="space-y-1">
					{#each data.participants as participant}
						<li class="text-gray-700">{participant.name}</li>
					{/each}
				</ul>
			</div>
		</div>

		{#if !data.exchange.isGenerated}
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
				<p class="text-yellow-800 font-medium">Assignments have not been generated yet.</p>
				<p class="text-yellow-600 text-sm mt-1">Check back later!</p>
			</div>
		{:else if form?.success && form?.assignedTo}
			<!-- Show Assignment -->
			<div class="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
				<p class="text-green-800 font-medium mb-2">You are Secret Santa for:</p>
				<p class="text-3xl font-bold text-green-900">{form.assignedTo}</p>
			</div>
		{:else}
			<!-- Login Form -->
			<form
				method="POST"
				action="?/viewAssignment"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							showAssignment = true;
						}
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Your Name
						</label>
						<select
							id="name"
							name="name"
							required
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						>
							<option value="">Select your name</option>
							{#each data.participants as participant}
								<option value={participant.name}>{participant.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						/>
					</div>

					{#if form?.error}
						<div class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
							{form.error}
						</div>
					{/if}

					<button
						type="submit"
						class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
					>
						View My Assignment
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
