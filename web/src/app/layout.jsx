import {Bricolage_Grotesque, Plus_Jakarta_Sans} from 'next/font/google';
import {PageLoader} from '@/components/site/PageLoader';
import {MotionProvider} from '@/components/ui/MotionProvider';
import {SmoothScroll} from '@/components/ui/SmoothScroll';
import {ThemeProvider} from '@/components/ui/themeProvider';
import {SITE} from '@/lib/site';
import './globals.css';

// Body text matches the app; headlines get something with a bit more character.
const jakarta = Plus_Jakarta_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-jakarta',
});

const bricolage = Bricolage_Grotesque({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-bricolage',
});

export const metadata = {
	metadataBase: new URL(SITE.url),
	title: {default: `chalo · ${SITE.tagline}`, template: '%s · chalo'},
	description: SITE.description,
	openGraph: {
		title: `chalo · ${SITE.tagline}`,
		description: SITE.description,
		url: SITE.url,
		siteName: 'chalo',
		images: ['/screens/map.webp'],
	},
};

export const viewport = {
	themeColor: [
		{media: '(prefers-color-scheme: light)', color: '#faf7f2'},
		{media: '(prefers-color-scheme: dark)', color: '#111311'},
	],
};

export default function RootLayout({children}) {
	return (
		<html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${bricolage.variable}`}>
			<body className="min-h-screen">
				{/* Without JavaScript the loader would never leave, so don't show it at all. */}
				<noscript>
					<style>{'#page-loader{display:none}'}</style>
				</noscript>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<MotionProvider>
						<PageLoader />
						<SmoothScroll />
						{children}
					</MotionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
