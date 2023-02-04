import Ably from 'ably';
import type { PageLoad } from './$types';

export const load: PageLoad = async function load({ data }) {
	try {
		const { token } = data;

		let serviceStatus = 'Offline';
		const ably = new Ably.Realtime.Promise({
			...token,
			authCallback: () => {
				/* todo(rodneylab): add token refresh logic */
			}
		});

		await ably.connection.once('connected');
		serviceStatus = 'Connected to ably';

		const channel = ably.channels.get('getting-started');

		return { channel, serviceStatus };
	} catch (error: unknown) {
		console.error(`Error in page load: ${error as string}`);
	}
};
