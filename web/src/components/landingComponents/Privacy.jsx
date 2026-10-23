import React from 'react';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
const Privacy = () => {
	return (
		<section className="px-6 lg:px-40 py-24" id="privacy">
			<div className="max-w-300 mx-auto px-10 py-16 rounded-3xl bg-primary-foreground relative overflow-hidden text-white shadow-2xl">
				<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
					<div className="flex flex-col gap-6 max-w-150">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-widest w-fit">
							<VerifiedUserIcon />
							Privacy Focused
						</div>
						<h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
							Your movement is private.
						</h2>
						<p className="text-lg text-white/90">
							We believe location data is sacred. Chalo uses temporary links
							that self-destruct. No history is stored on our servers, and no
							tracking continues after your session ends.
						</p>
					</div>
					<div className="flex flex-col gap-4 min-w-65">
						<div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
							<p className="text-sm font-bold uppercase mb-4 text-white/70">
								Safety Protocol
							</p>
							<ul className="space-y-3">
								<li className="flex items-center gap-2 text-sm">
									<CheckCircleIcon />
									No account needed
								</li>
								<li className="flex items-center gap-2 text-sm">
									<CheckCircleIcon />
									Encrypted live signal
								</li>
								<li className="flex items-center gap-2 text-sm">
									<CheckCircleIcon />
									Automatic session expiry
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sage/30 rounded-full blur-3xl"></div>
			</div>
		</section>
	);
};

export default Privacy;
