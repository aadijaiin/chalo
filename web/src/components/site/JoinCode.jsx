'use client';

import {ArrowRight} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';

const CODE_LENGTH = 6;

/** Got a code from a friend? This takes you to the invite page, which opens the app. */
export function JoinCode() {
	const router = useRouter();
	const [code, setCode] = useState('');
	const ready = code.length === CODE_LENGTH;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (ready) router.push(`/j/${code}`);
			}}
			className="flex w-full max-w-md gap-2"
		>
			<input
				value={code}
				onChange={(e) =>
					setCode(
						e.target.value
							.replace(/[^a-z0-9]/gi, '')
							.toUpperCase()
							.slice(0, CODE_LENGTH),
					)
				}
				placeholder="Party code"
				aria-label="Party code"
				autoCapitalize="characters"
				autoComplete="off"
				spellCheck={false}
				className="h-14 min-w-0 flex-1 rounded-2xl border border-border bg-card px-5 text-lg font-bold tracking-[0.3em] placeholder:font-semibold placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary focus:outline-none"
			/>
			<button
				type="submit"
				disabled={!ready}
				className="flex h-14 items-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-opacity disabled:opacity-40"
			>
				Join
				<ArrowRight className="size-5" />
			</button>
		</form>
	);
}
