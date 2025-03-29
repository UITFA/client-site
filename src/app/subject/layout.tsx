"use client";

import SubjectTable from "@/components/subjects/SubjectTable";
import { FilterProvider } from "@/contexts/FilterContext";
import { Card, CardBody } from "@nextui-org/card";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import SubjectTabs from "./tabs";

const tabs = [
	{
		link: "average-point",
		title: "Biểu đồ điểm trung bình",
	},
	{
		link: "point-per-year",
		title: "Thống kê điểm trung bình qua các năm",
	},
];

export default function Layout({ children }: { children: ReactNode }) {
	const pathName = usePathname();
	const tabName = useMemo(() => pathName.split("/").at(-1) || "", [pathName]);

	const router = useRouter();

	useEffect(() => {
		tabs.forEach(({ link }) => router.prefetch(`/subject/${link}`));
	}, [router]);

	return (
		<>
			<h1 className="font-semibold text-3xl">Môn học</h1>
			<SubjectTabs selectedTab={tabName} tabs={tabs} />
			<Card className=" w-full mt-5 p-0 h-[420px]">
				<CardBody className="p-0">
					<FilterProvider>{children}</FilterProvider>
				</CardBody>
			</Card>
			<FilterProvider>
				<SubjectTable />
			</FilterProvider>
		</>
	);
}
