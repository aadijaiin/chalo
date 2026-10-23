import React from 'react';

const ForWho = () => {
	return (
		<section className="px-6 lg:px-40 py-24">
			<div className="max-w-300 mx-auto">
				<div className="flex flex-col gap-4 mb-16">
					<h2 className="text-4xl font-extrabold tracking-tight text-earth">
						For Every Kind of Nomad
					</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					<div className="group relative overflow-hidden rounded-3xl aspect-16/10 bg-neutral-100 shadow-inner">
						<div
							className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
							style={{
								backgroundImage:
									'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCdvuTNUujOtRFdxdQrrqK4-fy_fkE-2SKxmXHyNXy3LsZ9AKHYyolOOzi7xbNLhQeVhNy5ODeK9UQx1jBsvsGWU7O27CfJQ1GBUPT2ZZLVCNglbTImNnH7E37oMzDQA0CA6I0M_47891RVvx5vXPJdawDHZmDyR02NNu4ISrItcp7SrhD5ofiPjx0XB9seIPz8QRhqhnECB-41z03QYY2TAk4K2QedCrC_GWe4yV4oJNo2X5edRe0qVG2rbKrdrGwCpGkFrwgHN1f0")',
							}}
						/>

						<div className="absolute inset-0 bg-linear-to-t from-[#242824cc] via-[#24282455] to-transparent" />

						<div className="absolute bottom-0 p-8 text-white">
							<h3 className="text-2xl font-extrabold mb-2">Social Circles</h3>
							<p className="text-white/80">
								Keep the group together at festivals, markets, or campus
								hangouts without the stress of constant texting.
							</p>
						</div>
					</div>

					<div className="group relative overflow-hidden rounded-3xl aspect-16/10 bg-neutral-100 shadow-inner">
						<div
							className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
							style={{
								backgroundImage:
									'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDeK10WMdZmo6znPGyauutMSvgGw0jq5FSyPX5zdkkJnt_fm8rB0EuCm2uUdNfyWCsj4_5_0SYaOv3AVZGCH83r8RGUzZQKANZSpCtSibZE-GVsLlHpXbQnWX2Lx45oS0Q0TjoudgXDmUImsQYYfqyDwJHa4MmWhs0cGDgHADSIK4kgsa92LCO-tCny582y1e1hVwbxjbFKfKuTfweKsellcZuqkxuPhZSqk4AspWGyjw3x4d0OHoXGRwODlJEGOnypnYbIGbD0J005")',
							}}
						/>

						<div className="absolute inset-0 bg-linear-to-t from-[#242824cc] via-[#24282455] to-transparent" />

						<div className="absolute bottom-0 p-8 text-white">
							<h3 className="text-2xl font-extrabold mb-2">Global Explorers</h3>
							<p className="text-white/80">
								Explore new cities with peace of mind. Find your way back to
								your group instantly in any winding alleyway.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default ForWho;
