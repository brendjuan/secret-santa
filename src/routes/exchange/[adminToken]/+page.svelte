<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { data, form } = $props();

	let copiedLink = $state(false);
	let editingPasswordId = $state<string | null>(null);
	let passwordValues = $state<Record<string, string>>({});
	let visibleAssignments = $state<Set<string>>(new Set());

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

	function startEditingPassword(participantId: string) {
		editingPasswordId = participantId;
		passwordValues[participantId] = '';
	}

	function cancelEditingPassword() {
		editingPasswordId = null;
	}

	function toggleAssignmentVisibility(participantId: string) {
		const newSet = new Set(visibleAssignments);
		if (newSet.has(participantId)) {
			newSet.delete(participantId);
		} else {
			newSet.add(participantId);
		}
		visibleAssignments = newSet;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
	<div class="max-w-4xl mx-auto py-8">
		<div class="bg-white rounded-lg shadow-xl p-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">{data.exchange.name}</h1>
			<p class="text-gray-600 mb-6">Gift Exchange Admin</p>

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
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-gray-800">
						Participants ({data.participants.length})
					</h2>
				</div>

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
								{#if !data.exchange.isGenerated}
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Password
									</th>
								{/if}
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
									{#if !data.exchange.isGenerated}
										<td class="px-6 py-4 whitespace-nowrap text-sm">
											{#if editingPasswordId === participant.id}
												<form
													method="POST"
													action="?/updatePassword"
													use:enhance={() => {
														return async ({ result, update }) => {
															await update();
															if (result.type === 'success') {
																editingPasswordId = null;
															}
														};
													}}
													class="flex gap-2"
												>
													<input type="hidden" name="participantId" value={participant.id} />
													<input
														type="text"
														name="password"
														required
														minlength="3"
														bind:value={passwordValues[participant.id]}
														class="flex-1 rounded-md border-gray-300 text-sm px-2 py-1"
														placeholder="New password"
													/>
													<button
														type="submit"
														class="text-green-600 hover:text-green-900 font-medium"
													>
														Save
													</button>
													<button
														type="button"
														onclick={cancelEditingPassword}
														class="text-gray-600 hover:text-gray-900 font-medium"
													>
														Cancel
													</button>
												</form>
											{:else}
												<button
													onclick={() => startEditingPassword(participant.id)}
													class="text-blue-600 hover:text-blue-900 font-medium"
												>
													Update
												</button>
											{/if}
										</td>
									{/if}
									{#if data.exchange.isGenerated}
										<td class="px-6 py-4 whitespace-nowrap text-sm">
											{#if visibleAssignments.has(participant.id)}
												<div class="flex items-center gap-2">
													<span class="text-gray-900">{getAssignedName(participant.assignedTo)}</span>
													<button
														onclick={() => toggleAssignmentVisibility(participant.id)}
														class="text-gray-500 hover:text-gray-700 text-xs"
													>
														Hide
													</button>
												</div>
											{:else}
												<button
													onclick={() => toggleAssignmentVisibility(participant.id)}
													class="text-gray-400 hover:text-blue-600 font-mono"
												>
													••••••••
												</button>
											{/if}
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
							{#if !data.exchange.isGenerated}
								<!-- Add Participant Row -->
								<tr class="bg-gray-50">
									<td colspan="3" class="px-6 py-4">
										<form
											method="POST"
											action="?/addParticipant"
											use:enhance
											class="flex gap-4"
										>
											<input
												type="text"
												name="name"
												required
												placeholder="Name"
												class="flex-1 rounded-md border-gray-300 text-sm"
											/>
											<input
												type="text"
												name="password"
												required
												minlength="3"
												placeholder="Password"
												class="flex-1 rounded-md border-gray-300 text-sm"
											/>
											<button
												type="submit"
												class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium whitespace-nowrap"
											>
												Add
											</button>
										</form>
									</td>
								</tr>
							{/if}
							{#if data.participants.length === 0}
								<tr>
									<td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">
										No participants yet. Add one below!
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
