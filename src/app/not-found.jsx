'use client';
import React from 'react';
import ExploreIcon from '@mui/icons-material/Explore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import NavigationIcon from '@mui/icons-material/Navigation';
const NotFound = () => {
	return (
		<main className="bg-background-light bg-background-dark h-screen w-screen flex flex-col overflow-hidden">
			<header className="absolute top-0 left-0 w-full p-6 md:p-8 z-20">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 md:w-10 md:h-10 bg-transparent rounded-lg md:rounded-xl flex items-center justify-center text-white">
						<ExploreIcon htmlColor="#e2725b" />
					</div>
					<h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
						Chalo
					</h1>
				</div>
			</header>
			<main className="relative flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
				<div className="absolute inset-0 opacity-10 map-bg -z-10"></div>
				<div className="flex flex-col items-center max-w-2xl w-full">
					<div className="relative mb-6 scale-90 md:scale-100">
						<div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto bg-sage/5 rounded-full flex items-center justify-center border-4 border-dashed border-sage/20">
							<div className="absolute w-full h-0.5 bg-sage/10 top-1/2 -rotate-12"></div>
							<div className="absolute h-full w-0.5 bg-sage/10 left-1/3 rotate-6"></div>
							<div className="relative flex flex-col items-center">
								<div className="bg-primary-foreground text-white p-3 rounded-full shadow-xl shadow-primary-foreground/30">
									<LocationOnIcon fontSize="large" />
								</div>
								<div className="mt-2 bg-card px-3 py-1.5 rounded-lg shadow-md border border-sage/10">
									<span className="text-[10px] md:text-xs font-bold text-primary-foreground uppercase tracking-widest">
										You are here?
									</span>
								</div>
							</div>
						</div>
						<div className="absolute -top-2 -right-2 w-12 h-12 bg-sage/10 rounded-full  rotate-12 flex items-center justify-center">
							<MapIcon fontSize="small" htmlColor="#8DA399" />
						</div>
						<div className="absolute bottom-2 -left-2 w-10 h-10 bg-primary-foreground/10 rounded-full -rotate-12 flex items-center justify-center">
							<NavigationIcon fontSize="small" htmlColor="#e2725b" />
						</div>
					</div>
					<div className="space-y-4">
						<h2 className="text-7xl md:text-8xl font-black text-primary-foreground  leading-none">
							404
						</h2>
						<div className="space-y-2">
							<h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground px-4">
								Oops! It looks like you&apos;ve wandered off the map.
							</h3>
							<p className="text-base md:text-lg text-sage font-medium max-w-md mx-auto px-4">
								The location you&apos;re looking for doesn&apos;t exist or has
								moved to a new set of coordinates.
							</p>
						</div>
						<div className="pt-6 ">
							<a
								className="bg-primary-foreground inline-flex items-center justify-center gap-3 px-6 py-3.5 text-white font-bold text-base md:text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all"
								href="#"
							>
								<DashboardIcon />
								Back to Dashboard
							</a>
						</div>
					</div>
				</div>
			</main>
			<footer className="absolute bottom-0 left-0 w-full p-6 text-center z-20">
				<p className="text-sage text-sm">
					Need help finding your way?{' '}
					<a className="text-foreground font-bold hover:underline" href="#">
						Contact Support
					</a>
				</p>
			</footer>
		</main>
	);
};

export default NotFound;
