import z from 'zod';
export const createPartySchema = z.object({
	name: z.string().min(3, 'Party name is too short.'),
	duration: z.preprocess(
		val => Number(val),
		z
			.number()
			.refine(
				val => [60, 120, 240, 480, 1440, 4320].includes(val),
				'Invalid duration selected',
			),
	),
});
