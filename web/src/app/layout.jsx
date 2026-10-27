import {Plus_Jakarta_Sans} from 'next/font/google';
import {ThemeProvider} from '@/components/ui/themeProvider';
import {SITE} from '@/lib/site';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-plus-jakarta-sans',
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
		<html lang="en" suppressHydrationWarning className={jakarta.className}>
			<body className="min-h-screen">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
