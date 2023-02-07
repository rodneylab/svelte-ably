<script lang="ts">
	import { cleanupPresence, initialisePresence } from '$lib/utilities/realtime';
	import type { Types } from 'ably';
	import { Realtime } from 'ably';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let { name, token } = data ?? {};
	$: ({ name, token } = data ?? {});

	let channel: Types.RealtimeChannelPromise | null = null;
	let message: string;
	let messages: Types.Message[] = [];
	let presenceData: Types.PresenceMessage[] = [];
	let serviceStatus = '';
	let status: string;

	onMount(async () => {
		let serviceStatus = 'Offline';
		const ably = new Realtime.Promise({
			...token,

			authCallback: () => {
				/* todo(rodneylab): add token refresh logic */
			}
		});

		await ably.connection.once('connected');
		serviceStatus = 'Connected to ably';

		channel = ably.channels.get('getting-started');

		channel?.subscribe((message) => {
			messages = [...(messages ?? []), message];
		});

		if (channel) {
			presenceData = await initialisePresence(channel, presenceData);
		}

		return () => {
			if (channel) {
				presenceData = cleanupPresence(channel, presenceData);
			}
		};
	});

	function sendMessage() {
		channel?.publish(message, { text: message });
	}
	function updateStatus() {
		status && channel?.presence.update(status);
	}
</script>

<h1>Sveltably</h1>
{#if !name}
	<form action="?/login" method="POST">
		<label for="name">Name</label>
		<input id="name" type="text" name="name" placeholder="Your login name" />
		<button type="submit">Login</button>
	</form>
{/if}
<form on:submit|preventDefault={sendMessage}>
	<label for="message">Message</label>
	<input bind:value={message} id="message" type="text" name="message" />
	<button type="submit">Send Message</button>
</form>

<form on:submit|preventDefault={updateStatus}>
	<label for="status">Status</label>
	<input bind:value={status} id="status" type="text" name="status" />
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
