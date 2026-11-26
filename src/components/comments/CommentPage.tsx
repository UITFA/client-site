"use client";

import CommentChart from "@/components/comments/CommentChart";
import CommentList from "@/components/comments/CommentList";
import CommentSearchBar from "@/components/comments/CommentSearchBar";
import ImportButton from "@/components/comments/ImportButton";
import { FacultySelectorWithSearchParams } from "@/components/selectors/FacultySelector";
import { ProgramSelectorWithSearchParam } from "@/components/selectors/ProgramSelector";
import { SemesterSelectorWithSearchParam } from "@/components/selectors/SemesterSelector";
import { SingleSubjectSelectorWithSearchParam } from "@/components/selectors/SingleSubjectSelector";
import { useCommentListLazyQuery } from "@/gql/graphql";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Button, Modal, Tab, Tabs, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { transformCommentData } from "./interfaces/IComment";

export default function CommentPage({ defaultFilter = {}, selectors = [] }: IProps) {
	const URL = process.env.BASE_API_URL;

	const searchParams = useSearchParams();

	const query = {
		...defaultFilter,
		keyword: searchParams.get("keyword"),
		semester_id: selectors.includes("semester")
			? searchParams.get("semester")
			: undefined,
		program: selectors.includes("program")
			? searchParams.get("program")
			: undefined,
		faculty_id: selectors.includes("faculty")
			? searchParams.get("faculty")
			: undefined,
		subjects: selectors.includes("single-subject")
			? searchParams.get("subject_id")
				? [searchParams.get("subject_id")]
				: undefined
			: undefined,
		sentiment: selectors.includes("single-subject")
			? searchParams.get("sentiment")
				? [searchParams.get("sentiment")]
				: undefined
			: undefined,
	};
	const [getCommentList, { data, loading: isLoading }] = useCommentListLazyQuery({
		fetchPolicy: "cache-and-network",
	});

	const { dataList: comments, bottomRef } = useInfiniteScroll({
		queryFunction: getCommentList,
		variables: { filter: query },
		isLoading,
		data: data?.comments.data,
		meta: data?.comments.meta,
	});

	const [activeTab, setActiveTab] = useState(0);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [file, setFile] = useState<File | null>(null);

	const handleOpenModal = () => setIsModalVisible(true);
	const handleCloseModal = () => setIsModalVisible(false);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setFile(event.target.files[0]);
		}
	};

	// Handle tab change
	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	// Handle file import
	const handleImportFile = async () => {
		if (!file) {
			alert("Vui lòng chọn một file để import.");
			return;
		}

		try {
			const formData = new FormData();
			formData.append("file", file);

			fetch(`${URL}/files/import`, {
				method: "POST",
				body: formData,
			});

			alert("Hệ thống đang xử lý, vui lòng quay lại sau ít phút nữa");
			setIsModalVisible(false);
		} catch (error) {
			console.error("Error during import:", error);
			alert("Import thất bại, vui lòng thử lại.");
		} finally {
			handleCloseModal();
		}
	};

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex flex-col xl:flex-row gap-8 xl:gap-0 items-center">
				{/* Filters */}
				<div className="flex flex-wrap gap-4 items-center">
					{selectors.includes("semester") && (
						<SemesterSelectorWithSearchParam />
					)}
					{selectors.includes("program") && (
						<ProgramSelectorWithSearchParam />
					)}
					{selectors.includes("faculty") && (
						<FacultySelectorWithSearchParams />
					)}
					{selectors.includes("single-subject") && (
						<SingleSubjectSelectorWithSearchParam
							defaultFilter={defaultFilter}
						/>
					)}
				</div>
				<div className="flex flex-row gap-5">
					<CommentSearchBar isLoading={!isLoading} />
					<ImportButton handleClick={handleOpenModal} />
				</div>
			</div>

			{/* Modal */}
			<Modal
				open={isModalVisible}
				onClose={handleCloseModal}
				closeAfterTransition
			>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 400,
						bgcolor: "white",
						boxShadow: 24,
						p: 4,
						borderRadius: "16px",
						display: "flex",
						flexDirection: "column",
						gap: 3,
					}}
				>
					<Typography
						variant="h5"
						component="h2"
						textAlign="center"
						sx={{ fontWeight: "bold", marginBottom: 2 }}
					>
						Nhập file từ thiết bị
					</Typography>
					<input
						type="file"
						accept=".xlsx, .csv"
						onChange={handleFileChange}
						style={{
							padding: "8px",
							border: "1px solid #ccc",
							borderRadius: "8px",
							width: "100%",
						}}
					/>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginTop: "16px",
						}}
					>
						<Button
							variant="contained"
							color="error"
							onClick={handleCloseModal}
							sx={{
								borderRadius: "10px",
								width: "48%",
							}}
						>
							Hủy
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleImportFile}
							sx={{
								borderRadius: "10px",
								width: "48%",
							}}
						>
							Tải lên
						</Button>
					</div>
				</Box>
			</Modal>

			{/* Tabs */}
			<Box sx={{ borderBottom: 1, borderColor: "divider", marginTop: "20px" }}>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					aria-label="Comment tabs"
				>
					<Tab label="Biểu đồ" />
					<Tab label="Danh sách bình luận" />
				</Tabs>
			</Box>

			{/* Tab Content */}
			{activeTab === 0 && (
				<div className="mt-4">
					{data?.comments?.data ? (
						<CommentChart
							response={{
								data: transformCommentData(data?.comments.data),
							}}
						/>
					) : (
						<p>Đang tải dữ liệu...</p>
					)}
				</div>
			)}
			{activeTab === 1 && (
				<div className="mt-4">
					<CommentList data={comments} />
				</div>
			)}
		</div>
	);
}

interface IProps {
	defaultFilter?: any;
	selectors?: string[];
}
