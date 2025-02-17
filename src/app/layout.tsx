import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "UIT Feedback Analysis",
	description:
		"Using artificial intelligence in analyzing student subject survey results",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	try {
		return (
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					<Providers>
						<div className="h-screen w-screen bg-background flex flex-row">
							{children}
							<Toaster />
						</div>
					</Providers>
				</body>
			</html>
		);
	} catch (error) {
		return (
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					<div className=" w-screen h-screen grid place-items-center">
						Trang web đang bảo trì
					</div>
				</body>
			</html>
		);
	}
}
