"use client";

import { BarChart } from "@components/chart/BarChart";

import { GET_CLASSES } from "@/constants/api_endpoint";
import { FilterProvider, useFilter } from "@/contexts/FilterContext";
import withQuery from "@/utils/withQuery";
import Loading from "@components/Loading";
import NoData from "@components/NoData";
import ChartLayout from "@components/chart/ChartLayout";
import { ProgramSelectorWithSearchParam } from "@components/selectors/ProgramSelector";
import { SemesterSelectorWithSearchParam } from "@components/selectors/SemesterSelector";
import { SortSelector } from "@components/selectors/SortSelector";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useMemo, useState } from "react";
import {
	Link,
	SortDescriptor,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
	getKeyValue,
} from "@nextui-org/react";
import TableSketon from "@/components/TableSkeleton";
import CriteriaPointTable from "@/components/CriteriaPointTable";

function Page_({ subject_id }: { subject_id: string }) {
	const router = useRouter();

	const searchParams = useSearchParams();
	const { sort } = useFilter();

	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "subject_name",
		direction: "ascending",
	});

	const { data, isLoading } = useSWR<IChartData>(
		withQuery(GET_CLASSES, {
			subject_id,
			semester_id: searchParams.get("semester"),
			program: searchParams.get("program"),
		}),
		(url: string) => fetch(url).then((r) => r.json())
	);

	const columns = useMemo(
		() =>
			data?.data
				? [
						...defaultColumns,
						...data.data[0].points.map((v) => ({
							key: v.criteria_id,
							index: v.index,
							label: v.criteria_name,
						})),
				  ]
				: defaultColumns,
		[data]
	);

	return (
		<>
			<ChartLayout
				primaryTitle="Biểu đồ điểm trung bình các lớp"
				legends={[LEGEND_NAME]}
				colors={["sky"]}
				columnNum={data?.data?.length || 0}
				height={450}
				handlerButtons={
					<>
						<SemesterSelectorWithSearchParam />
						{/* <CriteriaSelector /> */}
						<ProgramSelectorWithSearchParam />
						<SortSelector />
					</>
				}
			>
				<BarChart
					className=" h-full mt-4"
					data={
						data
							? [
									{
										label: LEGEND_NAME,
										data:
											data?.data?.map((d) => ({
												x: d.class_name,
												y: d.points[0].point * 100,
												id: d.class_id,
											})) || [],
										sort: sort,
									},
							  ]
							: undefined
					}
					valueFormatter={dataFormatter}
					noDataText={isLoading ? <Loading /> : <NoData />}
					onClick={({ index, data }) =>
						router.push(`/class/${data[0]?.id}`)
					}
				/>
			</ChartLayout>

			<div className="pt-10">
				{columns.length > 2 || !isLoading ? (
					<CriteriaPointTable
						sortDescriptor={sortDescriptor}
						setSortDescriptor={setSortDescriptor}
						isSort
						columns={columns}
						items={
							data?.data.map((v) => ({ ...v, id: v.class_id })) || []
						}
						itemHref="/class"
						key_name="class_name"
					/>
				) : (
					<TableSketon lines={6} />
				)}
			</div>
		</>
	);
}

export default function Page({
	params: { subject_id },
}: {
	params: { subject_id: string };
}) {
	return (
		<FilterProvider>
			<Page_ subject_id={subject_id} />
		</FilterProvider>
	);
}

const dataFormatter = (number: number) => {
	return `${Math.round(number)}%`;
};

interface IChartData {
	data: {
		class_name: string;
		class_id: string;
		points: {
			criteria_id: string;
			criteria_name: string;
			index: number;
			point: number;
		}[];
	}[];
}

const LEGEND_NAME = "Độ hài lòng";

const defaultColumns: {
	key: string;
	label: string;
	index?: number;
	width?: number;
}[] = [
	{
		key: "class_name",
		label: "Tên lớp",
		width: 300,
	},
];
