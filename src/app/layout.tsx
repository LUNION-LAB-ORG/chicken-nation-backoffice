import type {Metadata} from "next";
import "./globals.css";
import {sofia, urbanist, blocklynCondensed, blocklynGrunge} from './fonts';
import {Toaster} from 'react-hot-toast';
import {GoogleMapsProvider} from '@/contexts/GoogleMapsContext';
import {QueryProvider} from '@/providers/QueryProvider';
import {NuqsAdapter} from 'nuqs/adapters/next/app'

// Métadonnées de l'application
export const metadata: Metadata = {
	title: "Chicken Nation",
	description: "Champion dans poulet",
	icons: {
		icon: '/icons/logo.png',
		shortcut: '/icons/logo.png',
		apple: '/icons/logo.png',
	},
};


export default function RootLayout({
	                                   children,
                                   }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr"
		      className={`${sofia.variable} ${urbanist.variable} ${blocklynCondensed.variable} ${blocklynGrunge.variable}`}
		      suppressHydrationWarning>
		<head>
		</head>
		<body className="font-sofia" suppressHydrationWarning>
		<Toaster position="top-right" toastOptions={{
			duration: 3000,
			style: {
				background: '#f38200',
				color: '#fff',
			},
		}}/>
		<NuqsAdapter>
			<QueryProvider>
				<GoogleMapsProvider>
					{children}
				</GoogleMapsProvider>
			</QueryProvider>
		</NuqsAdapter>
		</body>
		</html>
	);
}
