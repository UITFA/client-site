import { CommentListQuery } from "@/gql/graphql";

export interface Comment {
	semester: {
		semester_id: number | null;
		display_name: string;
		type: string;
		year: string;
	};
	class: {
		class_id: number | null;
		display_name: string;
		semester_id: number | null;
		program: string;
		class_type: string;
		subject_id: number | null;
		lecturer_id: number | null;
		total_student: number | undefined;
		participating_student: number | undefined;
	};
	aspect: string;
	sentiment: "positive" | "negative" | "neutral";
	display_name: string;
	comment_id: number;
}

export const transformCommentData = (
	commentsData: CommentListQuery["comments"]["data"]
): Comment[] => {
	return commentsData.map((comment) => {
		return {
			semester: {
				semester_id: comment?.class?.semester?.semester_id ?? null,
				display_name: comment?.class?.semester?.display_name ?? "",
				type: comment?.class?.semester?.type ?? "",
				year: comment?.class?.semester?.year ?? "",
			},
			class: {
				class_id: comment?.class?.class_id ?? null,
				display_name: comment?.class?.display_name ?? "",
				program: comment?.class?.program ?? "",
				class_type: comment?.class?.class_type ?? "",
				semester_id: comment?.class?.semester?.semester_id ?? null,
				subject_id: comment?.class?.subject?.subject_id ?? null,
				lecturer_id: comment?.class?.lecturer?.lecturer_id ?? null,
				total_student: comment?.class?.total_student,
				participating_student: comment?.class?.participating_student ?? 0,
			},
			aspect: comment.aspect,
			sentiment: comment.sentiment as "positive" | "negative" | "neutral",
			display_name: comment?.content,
			comment_id: comment.comment_id,
		};
	});
};
