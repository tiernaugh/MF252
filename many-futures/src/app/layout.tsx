import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";

export const metadata: Metadata = {
	title: "Many Futures - Strategic Intelligence Platform",
	description: "AI-powered strategic foresight for forward-thinking organizations",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const lora = Lora({
	subsets: ["latin"],
	variable: "--font-lora",
	display: "swap",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable} ${lora.variable}`}>
			<body>{children}</body>
		</html>
	);
}
