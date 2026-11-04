import {Logo} from '@/components/site/Logo';
import {Skeleton} from '@/components/ui/Skeleton';

/** The boarding pass, in outline, while the invite page loads. */
export default function Loading() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 py-16">
			<Logo />
			<div className="w-full max-w-md overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-lift">
				<div className="flex flex-col gap-5 p-7 sm:p-8">
					<div className="flex justify-between">
						<Skeleton className="h-6 w-28 rounded-full" />
						<Skeleton className="h-4 w-20 rounded-full" />
					</div>
					<Skeleton className="h-9 w-3/4" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<div className="mt-2 grid grid-cols-6 gap-2">
						{Array.from({length: 6}).map((_, i) => (
							<Skeleton key={i} className="aspect-[4/5]" />
						))}
					</div>
				</div>
				<div className="mx-6 border-t-2 border-dashed border-border" />
				<div className="flex flex-col gap-3 p-7 sm:p-8">
					<Skeleton className="h-14" />
					<div className="grid grid-cols-2 gap-2">
						<Skeleton className="h-12" />
						<Skeleton className="h-12" />
					</div>
				</div>
			</div>
		</main>
	);
}
