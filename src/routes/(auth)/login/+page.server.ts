import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) redirect(302, '/');

	const form = await superValidate(zod4(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await auth.api.signInEmail({
				body: {
					email: form.data.email,
					password: form.data.password
				},
				headers: request.headers
			});
		} catch (err) {
			logger.warn('Login failed', { email: form.data.email, err });
			return message(form, 'Invalid email or password', { status: 400 });
		}

		redirect(302, '/');
	}
};
