import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import NavigationDrawer, { NavItem } from "@/components/NavigationDrawer";
import Providers from "./providers";

import CommentIcon from "@assets/CommentIcon";
import HomeIcon from "@assets/HomeIcon";
import SubjectIcon from "@assets/SubjectIcon";
import CriteriaIcon from "@assets/CriteriaIcon";
import { Suspense } from "react";
import LecturerNavIcon from "@/assets/LecturerNavIcon";
import { API_BASE_URL } from "@/constants/api_endpoint";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "QAQ app",
	description: "Generated by create next app",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	try {
		const pingResponse = await fetch(API_BASE_URL);

		return (
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					{pingResponse.status == 200 ? (
						<Providers>
							<div className="h-screen w-screen flex flex-row">
								<NavigationDrawer>
									<NavItem
										title="Trang chủ"
										link="/"
										icon={HomeIcon}
									/>
									<NavItem
										title="Bình luận"
										link="/comment"
										icon={CommentIcon}
										subItems={[
											{
												title: "Tất cả",
												link: "/comment",
											},
											{
												title: "Tích cực",
												link: "/comment?type=positive",
											},
											{
												title: "Tiêu cực",
												link: "/comment?type=negative",
											},
										]}
									/>
									<NavItem
										title="Môn học"
										link="/subject"
										icon={SubjectIcon}
										subItems={[
											{
												title: "Điểm trung bình các môn",
												link: "/subject/average-point",
											},
											{
												title: "Điểm trung bình qua các học kỳ",
												link: "/subject/point-per-year",
											},
										]}
									/>
									<NavItem
										title="Giảng viên"
										link="/lecturer"
										icon={LecturerNavIcon}
									/>
									<NavItem
										title="Tiêu chí"
										link="/criteria"
										icon={CriteriaIcon}
									/>
								</NavigationDrawer>
								<main className="w-full xl:px-20 lg:px-16 px-5 pt-12 pb-10 overflow-y-scroll overflow-x-hidden">
									<Suspense fallback={<p>Loading</p>}>
										{children}
									</Suspense>
								</main>
							</div>
						</Providers>
					) : (
						<div className=" w-screen h-screen grid place-items-center">
							Trang web đang bảo trì
						</div>
					)}
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
