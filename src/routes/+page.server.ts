import { ABLY_API_KEY } from '$env/static/private';
import { error as svelteKitError } from '@sveltejs/kit';
import Ably from 'ably';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function load({ url }) {
	try {
		const ably = new Ably.Realtime.Promise(ABLY_API_KEY);
		const token = await ably.auth.requestToken({ clientId: "it's me" });

		return { token };
	} catch (error: unknown) {
		const { pathname } = url;
		const message = `Error in server load function for ${pathname}: ${error as string}`;
		console.error(message);
		throw svelteKitError(500, message);
	}
};
