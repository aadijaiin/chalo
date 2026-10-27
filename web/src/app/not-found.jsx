import Link from 'next/link';
import {LogoMark} from '@/components/site/Logo';

export const metadata = {title: 'Page not found'};

export default function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 text-center">
			<LogoMark size={56} />
			<h1 className="text-3xl font-extrabold tracking-tight">This road doesn&apos;t go anywhere</h1>
			<p className="max-w-sm text-muted-foreground">
				The page you were looking for isn&apos;t here. If a friend sent you a party link, check that the code
				is complete.
			</p>
			<Link
				href="/"
				className="rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/30"
			>
				Back to chalo
			</Link>
		</main>
	);
}
