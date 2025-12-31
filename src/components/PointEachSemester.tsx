import { FilterProvider, useFilter } from "@/contexts/FilterContext";
import { GroupedPoint, usePointsEachSemesterLazyQuery } from "@/gql/graphql";
import { LineChart } from "@tremor/react";
import { ReactNode, useEffect, useState } from "react";
import ChartLayout from "./chart/ChartLayout";
import Loading from "./Loading";
import NoData from "./NoData";

type Props = {
	title: string;
	legend: string;
	selectors: ReactNode;
};

function InnerPointEachSemester({ title, legend, selectors }: Props) {
	const filter = useFilter();

	const [data, setData] = useState<GroupedPoint[]>([]);
	const [loading, setLoading] = useState(false);

	const variables = {
		program: filter.program,
		faculty_id: filter.faculty?.faculty_id,
		criteria_id: filter.criteria?.criteria_id,
		groupEntity: "Semester",
	};
	console.log(JSON.stringify(variables));

	const [fetchFunction] = usePointsEachSemesterLazyQuery();

	useEffect(() => {
		(async () => {
			setLoading(true);
			const response = await fetchFunction({
				variables,
                fetchPolicy: 'cache-and-network'
			});
			setData(response.data?.groupedPoints.data || []);
			setLoading(false);
		})();
	}, [JSON.stringify(variables)]);

	return (
		<ChartLayout
			primaryTitle={title}
			secondaryTitle={""}
			legends={[legend]}
			colors={["sky"]}
			isFullWidth
			handlerButtons={selectors}
		>
			<LineChart
				className=" h-full mt-4"
				data={
					[...data]
						.sort((a, b) => {
							const [semesterA, yearA] = a.display_name?.split(
								", "
							) || [0, 0];
							const [semesterB, yearB] = b.display_name?.split(
								", "
							) || [0, 0];
							if (yearA == yearB) {
								return (
									parseInt(semesterA.toString().at(-1) || "", 10) -
									parseInt(semesterB.toString().at(-1) || "", 10)
								);
							} else {
								return (
									parseInt(yearA.toString(), 10) -
									parseInt(yearB.toString(), 10)
								);
							}
						})
						.map((point) => ({
							Điểm: point.average_point * 4,
							semester_name: point.display_name,
						})) || []
				}
				index="semester_name"
				categories={["Điểm"]}
				colors={["sky"]}
				yAxisWidth={80}
				minValue={3.3}
				valueFormatter={(number: number) => {
					return `${number.toFixed(2)}`;
				}}
				showLegend={false}
				//@ts-ignore
				noDataText={loading ? <Loading /> : <NoData />}
			/>
		</ChartLayout>
	);
}

export default function PointEachSemester({ title, legend, selectors }: Props) {
	return (
		<FilterProvider>
			<InnerPointEachSemester
				title={title}
				legend={legend}
				selectors={selectors}
			/>
		</FilterProvider>
	);
}
