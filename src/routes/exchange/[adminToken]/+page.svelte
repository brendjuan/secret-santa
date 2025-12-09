<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { data, form } = $props();

	let showAddForm = $state(false);
	let copiedLink = $state(false);

	const viewUrl = `${$page.url.origin}${data.viewUrl}`;

	function copyLink() {
		navigator.clipboard.writeText(viewUrl);
		copiedLink = true;
		setTimeout(() => (copiedLink = false), 2000);
	}

	function getAssignedName(participantId: string | null) {
		if (!participantId) return 'Not assigned';
		const participant = data.participants.find((p) => p.id === participantId);
		return participant?.name || 'Unknown';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
	<div class="max-w-4xl mx-auto py-8">
		<div class="bg-white rounded-lg shadow-xl p-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">{data.exchange.name}</h1>
			<p class="text-gray-600 mb-6">Secret Santa Admin</p>

			<!-- Exchange Details -->
			<div class="mb-6 p-4 bg-gray-50 rounded-lg">
				<h2 class="text-lg font-semibold text-gray-800 mb-2">Exchange Details</h2>
				<div class="space-y-1 text-sm text-gray-600">
					{#if data.exchange.theme}
						<p>
							Theme: {data.exchange.theme}
						</p>
					{/if}
					{#if data.exchange.costMax}
						<p>
							Maximum Cost: ${data.exchange.costMax}
						</p>
					{/if}
					{#if data.exchange.randomSeed}
						<p>Random Seed: {data.exchange.randomSeed}</p>
					{/if}
					<p>Status: {data.exchange.isGenerated ? 'Assignments Generated' : 'Setting Up'}</p>
				</div>
			</div>

			<!-- Share Link -->
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<h2 class="text-lg font-semibold text-gray-800 mb-2">Participant Link</h2>
				<p class="text-sm text-gray-600 mb-2">Share this link with participants:</p>
				<div class="flex gap-2">
					<input
						type="text"
						readonly
						value={viewUrl}
						class="flex-1 rounded-md border-gray-300 bg-white text-sm"
					/>
					<button
						onclick={copyLink}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
					>
						{copiedLink ? 'Copied!' : 'Copy'}
					</button>
				</div>
			</div>

			<!-- Participants List -->
			<div class="mb-6">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-lg font-semibold text-gray-800">
						Participants ({data.participants.length})
					</h2>
					{#if !data.exchange.isGenerated}
						<button
							onclick={() => (showAddForm = !showAddForm)}
							class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
						>
							{showAddForm ? 'Cancel' : 'Add Participant'}
						</button>
					{/if}
				</div>

				<!-- Add Participant Form -->
				{#if showAddForm && !data.exchange.isGenerated}
					<form
						method="POST"
						action="?/addParticipant"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									showAddForm = false;
								}
							};
						}}
						class="mb-4 p-4 bg-gray-50 rounded-lg"
					>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
									Name
								</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
								/>
							</div>
							<div>
								<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<input
									type="text"
									id="password"
									name="password"
									required
									class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
								/>
							</div>
						</div>
						<button
							type="submit"
							class="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
						>
							Add Participant
						</button>
					</form>
				{/if}

				{#if form?.error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
						{form.error}
					</div>
				{/if}

				<!-- Participants Table -->
				<div class="border rounded-lg overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Name
								</th>
								{#if data.exchange.isGenerated}
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Assigned To
									</th>
								{/if}
								{#if !data.exchange.isGenerated}
									<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								{/if}
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.participants as participant}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{participant.name}
									</td>
									{#if data.exchange.isGenerated}
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
											{getAssignedName(participant.assignedTo)}
										</td>
									{/if}
									{#if !data.exchange.isGenerated}
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm">
											<form method="POST" action="?/removeParticipant" use:enhance>
												<input type="hidden" name="participantId" value={participant.id} />
												<button
													type="submit"
													class="text-red-600 hover:text-red-900 font-medium"
												>
													Remove
												</button>
											</form>
										</td>
									{/if}
								</tr>
							{/each}
							{#if data.participants.length === 0}
								<tr>
									<td colspan="2" class="px-6 py-4 text-center text-sm text-gray-500">
										No participants yet. Add some to get started!
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Generate Assignments Button -->
			{#if !data.exchange.isGenerated}
				<form method="POST" action="?/generateAssignments" use:enhance>
					<button
						type="submit"
						disabled={data.participants.length < 2}
						class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-md transition duration-200"
					>
						Generate Assignments
					</button>
				</form>
				{#if data.participants.length < 2}
					<p class="mt-2 text-sm text-gray-500 text-center">
						Add at least 2 participants to generate assignments
					</p>
				{/if}
			{:else}
				<form method="POST" action="?/regenerateAssignments" use:enhance>
					<button
						type="submit"
						class="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
					>
						Regenerate Assignments
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
