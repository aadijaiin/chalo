import {cn} from '@/lib/utils';
import {Reveal} from './Reveal';

/** Eyebrow, headline and a lead paragraph, the same rhythm in every section. */
export function SectionHeading({eyebrow, title, lead, align = 'left', className}) {
	return (
		<Reveal className={cn('flex max-w-2xl flex-col gap-4', align === 'center' && 'mx-auto items-center text-center', className)}>
			{eyebrow ? (
				<span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
					<span className="size-1.5 rounded-full bg-primary" />
					{eyebrow}
				</span>
			) : null}
			<h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.5rem]">{title}</h2>
			{lead ? <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{lead}</p> : null}
		</Reveal>
	);
}
