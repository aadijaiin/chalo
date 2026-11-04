import {Skeleton} from '@/components/ui/Skeleton';

/** The watch page's map and crew list, in outline, while the trip loads. */
export default function Loading() {
	return (
		<main className="flex h-dvh flex-col bg-background lg:flex-row-reverse">
			<Skeleton className="min-h-0 flex-1 rounded-none" />
			<aside className="flex max-h-[45dvh] flex-col gap-4 border-t border-border bg-card p-4 sm:p-5 lg:max-h-none lg:w-96 lg:border-r lg:border-t-0">
				<div className="flex justify-between">
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-7 w-24 rounded-full" />
				</div>
				<Skeleton className="h-3 w-32 rounded-full" />
				<Skeleton className="h-8 w-48" />
				{[0, 1, 2].map((i) => (
					<div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex flex-1 flex-col gap-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-36" />
						</div>
					</div>
				))}
			</aside>
		</main>
	);
}
