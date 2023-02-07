import type { Types } from 'ably';
import { PUBLIC_ABLY_CHANNEL } from '$env/static/public';

export const ablyChannelName = PUBLIC_ABLY_CHANNEL;

async function updatePresence(
	channel: Types.RealtimeChannelPromise,
	presenceData: Types.PresenceMessage[]
): Promise<Types.PresenceMessage[]> {
	const updatedPresenceData = await channel?.presence.get();
	if (updatedPresenceData) {
		return updatedPresenceData;
	}
	return presenceData;
}

export async function initialisePresence(
	channel: Types.RealtimeChannelPromise,
	presenceData: Types.PresenceMessage[]
): Promise<Types.PresenceMessage[]> {
	let updatedPresenceData = presenceData;
	channel?.presence.subscribe('enter', async () => {
		updatedPresenceData = await updatePresence(channel, updatedPresenceData);
	});
	channel?.presence.subscribe('leave', async () => {
		updatedPresenceData = await updatePresence(channel, updatedPresenceData);
	});
	channel?.presence.subscribe('update', async () => {
		updatedPresenceData = await updatePresence(channel, updatedPresenceData);
	});

	await channel?.presence.enter('');
	return (await channel?.presence.get()) ?? [];
}

export function cleanupPresence(
	channel: Types.RealtimeChannelPromise,
	presenceData: Types.PresenceMessage[]
): Types.PresenceMessage[] {
	if (channel) {
		channel.presence.leave();
		channel.presence.unsubscribe('enter', () => {
			updatePresence(channel, presenceData);
		});
		channel.presence.unsubscribe('leave', () => {
			updatePresence(channel, presenceData);
		});
		channel.presence.unsubscribe('update', () => {
			updatePresence;
		});

		channel.unsubscribe(ablyChannelName);
		channel.detach();
	}
	return [];
}
