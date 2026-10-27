'use client';

import {CircleCheck, KeyRound, LoaderCircle} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {browserClient, supabaseConfigured} from '@/lib/supabase';

// Same rule as signing up in the app.
function passwordProblem(p) {
	if (p.length < 8) return 'At least 8 characters';
	if (!/[0-9]/.test(p)) return 'Include at least one number';
	return null;
}

function linkError() {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
	return params.get('error_description');
}

export default function ResetForm() {
	const supabase = useMemo(() => (supabaseConfigured ? browserClient() : null), []);
	// checking → ready (link worked) | invalid (expired or opened twice) → done
	const [stage, setStage] = useState('checking');
	const [error, setError] = useState(null);
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!supabase) {
			setStage('invalid');
			return;
		}
		if (linkError()) {
			setStage('invalid');
			return;
		}
		const {data} = supabase.auth.onAuthStateChange((event, session) => {
			if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
				setStage('ready');
			}
		});
		// No recovery session from the link after a moment: it expired or was already used.
		const t = setTimeout(() => setStage((s) => (s === 'checking' ? 'invalid' : s)), 4000);
		return () => {
			clearTimeout(t);
			data.subscription.unsubscribe();
		};
	}, [supabase]);

	async function save(e) {
		e.preventDefault();
		const problem = passwordProblem(password) ?? (password !== confirm ? 'The two passwords don’t match' : null);
		if (problem) {
			setError(problem);
			return;
		}
		setSaving(true);
		setError(null);
		const {error: err} = await supabase.auth.updateUser({password});
		setSaving(false);
		if (err) {
			setError(err.message);
			return;
		}
		await supabase.auth.signOut({scope: 'local'});
		setStage('done');
	}

	if (stage === 'checking') {
		return (
			<div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
				<LoaderCircle className="size-6 animate-spin" />
				<p className="text-sm">Checking your reset link…</p>
			</div>
		);
	}

	if (stage === 'invalid') {
		return (
			<div className="flex flex-col gap-3 text-center">
				<h1 className="text-xl font-extrabold">This link has expired</h1>
				<p className="text-sm text-muted-foreground">
					Reset links work once and only for a short while. Open chalo, tap{' '}
					<strong className="text-foreground">Forgot password</strong> on the sign-in screen, and use the new
					email.
				</p>
			</div>
		);
	}

	if (stage === 'done') {
		return (
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex size-14 items-center justify-center rounded-full bg-sage/15">
					<CircleCheck className="size-7 text-sage" />
				</div>
				<h1 className="text-xl font-extrabold">Password changed</h1>
				<p className="text-sm text-muted-foreground">Open chalo and sign in with your new password.</p>
			</div>
		);
	}

	const inputClass =
		'h-12 w-full rounded-2xl border border-border bg-background px-4 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none';
	return (
		<form onSubmit={save} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
					<KeyRound className="size-6 text-primary" />
				</div>
				<h1 className="text-xl font-extrabold">Choose a new password</h1>
				<p className="text-sm text-muted-foreground">At least 8 characters, with a number.</p>
			</div>
			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="New password"
				autoComplete="new-password"
				className={inputClass}
			/>
			<input
				type="password"
				value={confirm}
				onChange={(e) => setConfirm(e.target.value)}
				placeholder="Type it again"
				autoComplete="new-password"
				className={inputClass}
			/>
			{error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
			<button
				type="submit"
				disabled={saving || !password}
				className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-opacity disabled:opacity-50"
			>
				{saving ? <LoaderCircle className="size-5 animate-spin" /> : null}
				Save password
			</button>
		</form>
	);
}
