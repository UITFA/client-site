declare type Semester = {
	semester_name: string;
	semester_id: number;
};

declare type IComment = {
	content: string;
	sentiment: "positive" | "negative" | "neutral";
	comment_id: number;
	teach_id: number;
};

declare type Criteria = {
	criteria_id: number;
	display_name: string;
	index?: number;
};

declare type Subject = {
	average_point: number;
	faculty_id: number;
	faculty_name: string;
	subject_id: number;
	subject_name: string;
};

interface IncrementalData<T> {
	meta: {
		total: string;
		page_size: string;
		pages: string;
		current_page: string;
		has_previous: boolean;
		has_next: boolean;
	};
	data: T[];
}

declare type Faculty = {
	faculty_id: number;
	faculty_name: string;
};

declare type IClass = {
	class_id: number;
	class_name: string;
	total: number;
	attend: number;
	class_type: string;
	semester_id: number;
	semester_name: string;
	faculty_id: number;
	faculty_name: string;
	subject_id: number;
	subject_name: string;
	point: number;
};

declare type ISortOptions = "asc" | "desc" | undefined;

declare interface IFilter {
	type?: string | null;
	q?: string | null;
	lecturer_id?: number | null;
	faculty_id?: number | null;
	faculty_name?: string | null;
	program?: string | null;
	semester_id?: number | null;
	subject_ids?: number[];
	subject_id?: number | null;
	sort?: "asc" | "desc";
}

declare interface IPoint {
	criteria_id: number;
	criteria_name: string;
	max_point: number;
	point: number;
}

declare type SelectorType =
	| "semester"
	| "program"
	| "faculty"
	| "single-subject"
	| "multi-subject";

type ArrayElement<ArrayType extends readonly unknown[]> =
	ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
