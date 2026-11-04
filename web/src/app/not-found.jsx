import {ArrowLeft} from 'lucide-react';
import {Logo} from '@/components/site/Logo';
import {Button} from '@/components/ui/Button';
import {LostMap} from '@/components/site/LostMap';

export const metadata = {title: 'Page not found'};

export default function NotFound() {
	return (
		<main className="grain relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-background px-4 py-16 text-center">
			<div aria-hidden className="pointer-events-none absolute left-1/2 top-1/4 size-[32rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[110px]" />
			<Logo className="relative" />
			<LostMap />
			<div className="relative flex max-w-md flex-col items-center gap-3">
				<span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">404 · Recalculating route…</span>
				<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">This road doesn&apos;t go anywhere</h1>
				<p className="text-muted-foreground">
					The page you were looking for isn&apos;t here. If a friend sent you a party link, check that the code is complete.
				</p>
			</div>
			<Button href="/" magnetic className="relative">
				<ArrowLeft className="size-4" />
				Back to chalo
			</Button>
		</main>
	);
}
