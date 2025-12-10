<script lang="ts">
	let { data } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
	<div class="max-w-2xl mx-auto py-8">
		<div class="bg-white rounded-lg shadow-xl p-8">
			{#if data.isValidKey && data.assignment}
				<!-- Valid token and assignment exists -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-800 mb-2">{data.exchange.name}</h1>
						<p class="text-lg text-gray-600">Secret Santa Assignment</p>
					</div>

					<div class="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
						<p class="text-lg text-gray-700 mb-4">
							Hi <strong>{data.participant.name}</strong>! 🎁
						</p>
						<p class="text-xl text-gray-800 mb-2">Your Secret Santa assignment is:</p>
						<div class="text-3xl font-bold text-green-700 mb-4">
							{data.assignment.name}
						</div>
						{#if data.assignment.email}
							<p class="text-sm text-gray-600">
								Contact: {data.assignment.email}
							</p>
						{/if}
					</div>

					<!-- Exchange Details -->
					<div class="mb-6 p-4 bg-gray-50 rounded-lg text-left">
						<h3 class="font-semibold text-gray-800 mb-2">Exchange Details</h3>
						<div class="space-y-1 text-sm text-gray-600">
							{#if data.exchange.theme}
								<p>Theme: {data.exchange.theme}</p>
							{/if}
							{#if data.exchange.costMax}
								<p>Maximum Cost: ${data.exchange.costMax}</p>
							{/if}
						</div>
					</div>

					<div class="text-sm text-gray-500">
						<p>🔒 This is your personal assignment page.</p>
						<p>Keep this URL private and don't share your assignment with others!</p>
					</div>

					<!-- Link to general view -->
					<div class="mt-6 pt-4 border-t">
						<a
							href={data.viewUrl}
							class="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
						>
							← View all participants
						</a>
					</div>
				</div>
			{:else if !data.isValidKey && data.message}
				<!-- Assignments not generated yet -->
				<div class="text-center">
					<div class="mb-6">
						<h1 class="text-3xl font-bold text-gray-800 mb-2">{data.exchange.name}</h1>
						<p class="text-lg text-gray-600">Secret Santa</p>
					</div>

					<div class="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
						<p class="text-lg text-gray-700 mb-4">
							Hi <strong>{data.participant.name}</strong>! 👋
						</p>
						<p class="text-gray-600">{data.message}</p>
					</div>

					<!-- Link to general view -->
					<div class="mt-6">
						<a
							href={data.viewUrl}
							class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
						>
							View Exchange Details
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>