import {Logo} from '@/components/site/Logo';
import {Skeleton} from '@/components/ui/Skeleton';

/** The recap poster, in outline, while the trip's numbers load. */
export default function Loading() {
	return (
		<main className="flex min-h-screen flex-col items-center gap-10 bg-background px-4 py-14 sm:py-20">
			<Logo />
			<div className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-lift">
				<div className="flex flex-col gap-3 bg-primary/15 p-8 sm:p-10">
					<Skeleton className="h-3 w-40 rounded-full" />
					<Skeleton className="h-11 w-2/3" />
					<Skeleton className="h-5 w-28" />
				</div>
				<div className="grid grid-cols-2 border-b border-border">
					{[0, 1].map((i) => (
						<div key={i} className="flex flex-col gap-2 p-6 sm:p-8">
							<Skeleton className="h-3 w-20 rounded-full" />
							<Skeleton className="h-11 w-28" />
						</div>
					))}
				</div>
				<div className="flex flex-col gap-2 p-4 sm:p-6">
					{[0, 1, 2].map((i) => (
						<div key={i} className="flex items-center gap-3 px-3 py-2">
							<Skeleton className="size-11 rounded-full" />
							<Skeleton className="h-5 flex-1" />
							<Skeleton className="h-5 w-16" />
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
