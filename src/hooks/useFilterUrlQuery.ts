import { FilterArgs, Role, useProfileQuery } from "@/gql/graphql";
import { useAuth } from "@/stores/auth.store";
import withQuery from "@/utils/withQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function useFilterUrlQuery() {
	const router = useRouter();
	const params = useSearchParams();

	const currentPathname = usePathname();

	const { authData } = useAuth();
	const { data } = useProfileQuery();

	const [query, setQuery] = useState<FilterArgs>(
		params.has("tree")
			? JSON.parse(decodeURI(params.get("tree")?.toString() || ""))
			: {
					criteria_id: null,
					semester_id: null,
					faculty_id: null,
					subjects: undefined,
					lecturer_id: null,
					program: "",
					class_type: "",
					class_id: null,
			  }
	);

	const setUrlQuery = useCallback(
		(pathname: string, newQuery: Partial<FilterArgs> = {}, queryParams = {}) => {
			router.push(
				withQuery(pathname, {
					...Object.fromEntries(params.entries()),
					tree: encodeURI(JSON.stringify({ ...query, ...newQuery })),
					...queryParams,
				})
			);
		},
		[params, query, router]
	);

	useEffect(() => {
		if (params.has("tree"))
			setQuery(JSON.parse(decodeURI(params.get("tree")?.toString() || "")));
	}, [params]);

	return {
		query: {
			...query,
			faculty_id:
				data?.profile.role === Role.Faculty
					? data?.profile.faculty?.faculty_id
					: query.faculty_id,
			lecturer_id:
				data?.profile.role === Role.Lecturer
					? data?.profile.lecturer?.lecturer_id
					: query.lecturer_id,
		},
		setUrlQuery,
	};
}
