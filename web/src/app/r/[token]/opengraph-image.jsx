import {ImageResponse} from 'next/og';
import {avatarBase64Uri, MEMBER_COLORS} from '@/lib/avatar';
import {formatDuration, formatKm} from '@/lib/format';
import {headline, loadRecap} from './recap';

export const size = {width: 1200, height: 630};
export const contentType = 'image/png';
export const alt = 'A chalo trip recap';

const SAND = '#FAF7F2';
const INK = '#26211D';
const TERRACOTTA = '#E2725B';
const MUTED = '#7A726B';

/** The preview card chat apps show for a recap link. */
export default async function Image({params}) {
	const recap = await loadRecap((await params).token);
	const crew = recap?.crew.slice(0, 5) ?? [];

	return new ImageResponse(
		(
			<div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: SAND, padding: 64, color: INK}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 800}}>
					<div style={{width: 40, height: 40, borderRadius: 20, background: TERRACOTTA}} />
					chalo
					<span style={{marginLeft: 16, fontSize: 24, fontWeight: 700, color: TERRACOTTA, letterSpacing: 3}}>TRIP RECAP</span>
				</div>
				<div style={{display: 'flex', marginTop: 36, fontSize: 64, fontWeight: 800, lineHeight: 1.05}}>
					{recap ? headline(recap) : 'Trip recap'}
				</div>
				{recap ? (
					<div style={{display: 'flex', gap: 56, marginTop: 28, fontSize: 30, color: MUTED}}>
						<span style={{display: 'flex', gap: 12}}>
							<b style={{color: INK}}>{formatKm(recap.totalM)}</b> together
						</span>
						<span style={{display: 'flex', gap: 12}}>
							<b style={{color: INK}}>{formatDuration(recap.durationS)}</b> on the road
						</span>
					</div>
				) : null}
				<div style={{display: 'flex', gap: 28, marginTop: 'auto'}}>
					{crew.map((m, i) => (
						<div key={m.avatarSeed} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
							<img
								alt=""
								src={avatarBase64Uri(m.avatarStyle, m.avatarSeed)}
								width={104}
								height={104}
								style={{borderRadius: 52, border: `6px solid ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}}
							/>
							<span style={{fontSize: 26, fontWeight: 700}}>{m.name}</span>
							<span style={{fontSize: 22, color: MUTED}}>{formatKm(m.distanceM)}</span>
						</div>
					))}
				</div>
			</div>
		),
		size,
	);
}
