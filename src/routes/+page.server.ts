import { ABLY_API_KEY } from '$env/static/private';
import { Temporal } from '@js-temporal/polyfill';
import { error as svelteKitError, fail, redirect } from '@sveltejs/kit';
import Ably from 'ably';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
	login: async ({ cookies, request }) => {
		const form = await request.formData();
		const name = form.get('name');
		if (typeof name === 'string' && name) {
			let clientId = cookies.get('clientId');
			if (!clientId) {
				clientId = crypto.randomUUID();
			}

			cookies.set('session', JSON.stringify({ clientId, name }), {
				path: '/',
				expires: new Date(Temporal.Now.plainDateTimeISO().add({ hours: 2 }).toString()),
				sameSite: 'lax',
				httpOnly: true
			});

			throw redirect(303, '/');
		}
		return fail(400, { name, missing: true });
	}
};

export const load: PageServerLoad = async function load({ cookies, url }) {
	try {
		const session = cookies.get('session');
		if (session) {
			const { clientId, name } = JSON.parse(session);

			const ably = new Ably.Realtime.Promise(ABLY_API_KEY);
			const token = await ably.auth.requestToken({ clientId });

			return { name, token };
		}
	} catch (error: unknown) {
		const { pathname } = url;
		const message = `Error in server load function for ${pathname}: ${error as string}`;
		console.error(message);
		throw svelteKitError(500, message);
	}
};
