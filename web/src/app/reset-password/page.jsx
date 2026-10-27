import {Logo} from '@/components/site/Logo';
import ResetForm from './ResetForm';

export const metadata = {
	title: 'Reset your password',
	robots: {index: false},
};

/** Where the "forgot password" email from the app lands. */
export default function ResetPasswordPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-16">
			<Logo />
			<div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
				<ResetForm />
			</div>
		</main>
	);
}
