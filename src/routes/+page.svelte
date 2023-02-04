<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type Ably from 'ably';

	export let data: PageData;

	let { channel, serviceStatus } = data;
	$: ({ channel, serviceStatus } = data);

	let message: string;
	let messages: Ably.Types.Message[] = [];
	let presenceData: Ably.Types.PresenceMessage[] = [];
	let status: string;

	onMount(async () => {
		channel?.subscribe((message) => {
			messages = [...(messages ?? []), message];
		});

		async function updatePresence() {
			const updatedPresenceData = await channel?.presence.get();
			if (updatedPresenceData) {
				presenceData = updatedPresenceData;
			}
		}

		channel?.presence.subscribe('enter', updatePresence);
		channel?.presence.subscribe('leave', updatePresence);
		channel?.presence.subscribe('update', updatePresence);

		await channel?.presence.enter('');
		presenceData = (await channel?.presence.get()) ?? [];

		return () => {
			if (channel) {
				channel.presence.leave();
				channel.presence.unsubscribe('enter', updatePresence);
				channel.presence.unsubscribe('leave', updatePresence);
				channel.presence.unsubscribe('update', updatePresence);

				channel.unsubscribe('getting-started');
				channel.detach();
			}
			presenceData = [];
		};
	});
	function sendMessage() {
		channel?.publish(message, { text: message });
	}
	function updateStatus() {
		status && channel?.presence.update(status);
	}
</script>

<form on:submit|preventDefault={sendMessage}>
	<label for="message">Message</label>
	<input bind:value={message} id="message" type="text" name="message" />
	<button type="submit">Send Message</button>
</form>

<form on:submit|preventDefault={updateStatus}>
	<label for="status">Status</label>
	<input bind:value={status} id="message" type="text" name="status" />
	<button type="submit">Update status</button>
</form>

<dl>
	<dt>Status:</dt>
	<dd>{serviceStatus}</dd>
	<dt>Messages:</dt>
	<dd><pre>{JSON.stringify(messages, null, 2)}</pre></dd>
</dl>

<h2>Clients</h2>
<ul>
	{#each presenceData ?? [] as { clientId, data }}
		<li>{clientId}: {data}</li>
	{/each}
</ul>
