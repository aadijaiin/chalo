import {z} from 'zod';

export const signupSchema = z
	.object({
		first_name: z.string().min(2, 'First name is too short.'),
		last_name: z
			.string()
			.min(2, 'Last name is too short.')
			.optional()
			.or(z.literal('')),
		email: z.email({message: 'Invalid email address.'}),
		username: z.string().min(3, 'Username must be at least 3 characters'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirm_password: z.string(),
	})
	.refine(data => data.password === data.confirm_password, {
		message: 'Passwords do not match',
		path: ['confirm_password'],
	});
