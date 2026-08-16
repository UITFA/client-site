"use client";

import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Spinner,
	Textarea,
	useDisclosure,
} from "@nextui-org/react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import {
	ChangeEvent,
	FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SENTIMENT_COLORS: Record<string, string> = {
	positive: "#6ee7b7",
	negative: "#fda4af",
	neutral: "#fcd34d",
	unknown: "#cbd5e1",
};
// Distinct hues so neighbouring pie slices stay readable.
const ASPECT_COLORS: Record<string, string> = {
	PROFESSIONALISM: "#93c5fd",
	TEACHING_METHOD: "#c4b5fd",
	MATERIAL: "#fbcfe8",
	ASSESSMENT: "#fdba74",
	FACILITY: "#5eead4",
	OTHERS: "#bef264",
	UNKNOWN: "#cbd5e1",
};
const ASPECT_FALLBACK_COLORS = [
	"#93c5fd",
	"#c4b5fd",
	"#fbcfe8",
	"#fdba74",
	"#5eead4",
	"#bef264",
	"#f9a8d4",
	"#a5b4fc",
];
const ASPECT_LABELS: Record<string, string> = {
	PROFESSIONALISM: "Chuyên môn / thái độ",
	TEACHING_METHOD: "Phương pháp giảng dạy",
	MATERIAL: "Tài liệu / giáo trình",
	ASSESSMENT: "Bài tập / kiểm tra",
	FACILITY: "Cơ sở vật chất",
	OTHERS: "Khác",
	UNKNOWN: "Chưa phân loại",
};
const SENTIMENT_LABELS: Record<string, string> = {
	positive: "Tích cực",
	negative: "Tiêu cực",
	neutral: "Trung tính",
	unknown: "Chưa rõ",
};
// Pastel fills wash out as text, so metrics use a deeper tone of the same hue.
const SENTIMENT_TEXT_COLORS: Record<string, string> = {
	positive: "#059669",
	negative: "#e11d48",
	neutral: "#d97706",
};

type AnalyticsRow = {
	semester: string;
	academic_year: string;
	aspect: string;
	sentiment: string;
	count: number;
};

type Facets = {
	semesters: string[];
	academic_years: string[];
	faculties: string[];
	courses: string[];
	classes: string[];
	aspects: string[];
	sentiments: string[];
};

type CommentDocument = {
	_id: string;
	meta?: Record<string, string>;
	content?: { comment?: string };
	label?: { sentiment?: string; aspect?: string[] };
	predict?: {
		sentiment?: string;
		aspect?: string[];
		aspect_sentiments?: Record<string, string>;
	};
	status?: { is_labeled?: boolean; is_predicted?: boolean };
};

type Filters = {
	academic_year: string;
	semester: string;
	faculty: string;
	course: string;
	class_name: string;
	aspect: string;
	sentiment: string;
	keyword: string;
};

const EMPTY_FILTERS: Filters = {
	academic_year: "",
	semester: "",
	faculty: "",
	course: "",
	class_name: "",
	aspect: "",
	sentiment: "",
	keyword: "",
};

const EMPTY_FACETS: Facets = {
	semesters: [],
	academic_years: [],
	faculties: [],
	courses: [],
	classes: [],
	aspects: [
		"PROFESSIONALISM",
		"TEACHING_METHOD",
		"MATERIAL",
		"ASSESSMENT",
		"FACILITY",
		"OTHERS",
	],
	sentiments: ["positive", "negative", "neutral"],
};

const FILTER_FIELDS: Array<{
	key: keyof Filters;
	label: string;
	facetKey: keyof Facets;
}> = [
	{ key: "academic_year", label: "Năm học", facetKey: "academic_years" },
	{ key: "semester", label: "Học kỳ", facetKey: "semesters" },
	{ key: "faculty", label: "Khoa", facetKey: "faculties" },
	{ key: "course", label: "Môn học", facetKey: "courses" },
	{ key: "class_name", label: "Lớp", facetKey: "classes" },
	{ key: "aspect", label: "Khía cạnh", facetKey: "aspects" },
	{ key: "sentiment", label: "Cảm xúc", facetKey: "sentiments" },
];

// Only the organisational chain is nested, so changing one of these levels
// drops the narrower selections that may no longer exist underneath it.
const NARROWING_CHAIN: Array<keyof Filters> = [
	"academic_year",
	"faculty",
	"course",
	"class_name",
];

function narrowerKeysOf(key: keyof Filters): Array<keyof Filters> {
	const index = NARROWING_CHAIN.indexOf(key);
	if (index < 0) return [];
	return NARROWING_CHAIN.slice(index + 1);
}

export default function SurveyDashboard() {
	const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
	const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
	const [comments, setComments] = useState<CommentDocument[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
	const [draftKeyword, setDraftKeyword] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState("");
	const [feedback, setFeedback] = useState("");
	const [prediction, setPrediction] = useState<Record<string, string> | null>(null);
	const [predicting, setPredicting] = useState(false);
	const [importKind, setImportKind] = useState<"raw" | "labeled">("raw");
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importBusy, setImportBusy] = useState(false);
	const [importMessage, setImportMessage] = useState("");
	const [exportBusy, setExportBusy] = useState<"labeling" | "training" | "">("");
	const [predictBatchBusy, setPredictBatchBusy] = useState(false);
	const [actionMessage, setActionMessage] = useState("");
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const {
		isOpen: importOpen,
		onOpen: openImport,
		onOpenChange: onImportOpenChange,
	} = useDisclosure();

	const params = useMemo(() => {
		const query = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value) query.set(key, value);
		});
		return query;
	}, [filters]);

	const facetParams = useMemo(() => {
		const query = new URLSearchParams();
		(
			[
				"academic_year",
				"semester",
				"faculty",
				"course",
				"class_name",
				"aspect",
			] as Array<keyof Filters>
		).forEach((key) => {
			if (filters[key]) query.set(key, filters[key]);
		});
		return query;
	}, [filters]);

	const breadcrumb = useMemo(() => {
		return FILTER_FIELDS.filter((item) => filters[item.key]).map((item) => {
			const raw = filters[item.key];
			const label =
				item.key === "aspect"
					? ASPECT_LABELS[raw] || raw
					: item.key === "sentiment"
					? SENTIMENT_LABELS[raw] || raw
					: item.key === "semester"
					? `HK ${raw}`
					: raw;
			return `${item.label}: ${label}`;
		});
	}, [filters]);

	const loadDashboard = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const [analyticsResponse, commentsResponse] = await Promise.all([
				fetch(`${API_URL}/analytics/comments?${params.toString()}`),
				fetch(`${API_URL}/comments?${params.toString()}&limit=20`),
			]);
			if (!analyticsResponse.ok || !commentsResponse.ok) {
				throw new Error("Backend trả về lỗi");
			}
			const analyticsJson = await analyticsResponse.json();
			const commentsJson = await commentsResponse.json();
			setAnalytics(analyticsJson.data || []);
			setComments(commentsJson.data || []);
			setCursor(commentsJson.next_cursor || null);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Không thể tải dữ liệu",
			);
		} finally {
			setLoading(false);
		}
	}, [params]);

	useEffect(() => {
		fetch(`${API_URL}/facets?${facetParams.toString()}`)
			.then((response) => (response.ok ? response.json() : Promise.reject()))
			.then((data) => setFacets({ ...EMPTY_FACETS, ...data }))
			.catch(() => setFacets(EMPTY_FACETS));
	}, [facetParams]);

	useEffect(() => {
		loadDashboard();
	}, [loadDashboard]);

	function updateFilter(key: keyof Filters, value: string) {
		setFilters((current) => {
			const next: Filters = { ...current, [key]: value };
			for (const narrower of narrowerKeysOf(key)) {
				next[narrower] = "";
			}
			return next;
		});
	}

	const totals = useMemo(() => {
		const bySentiment: Record<string, number> = {};
		let total = 0;
		analytics.forEach((row) => {
			total += row.count;
			bySentiment[row.sentiment] =
				(bySentiment[row.sentiment] || 0) + row.count;
		});
		return { total, bySentiment };
	}, [analytics]);

	const semesterChart = useMemo(() => {
		const grouped: Record<string, Record<string, number | string>> = {};
		analytics.forEach((row) => {
			const key = `${row.academic_year} · HK${row.semester}`;
			grouped[key] ||= { name: key };
			grouped[key][row.sentiment] =
				Number(grouped[key][row.sentiment] || 0) + row.count;
		});
		return Object.values(grouped);
	}, [analytics]);

	const aspectChart = useMemo(() => {
		const grouped: Record<string, number> = {};
		analytics.forEach((row) => {
			grouped[row.aspect] = (grouped[row.aspect] || 0) + row.count;
		});
		return Object.entries(grouped)
			.map(([name, value]) => ({
				name,
				value,
				label: ASPECT_LABELS[name] || name,
			}))
			.sort((a, b) => b.value - a.value);
	}, [analytics]);

	const loadMore = useCallback(async () => {
		if (!cursor || loadingMore) return;
		setLoadingMore(true);
		try {
			const query = new URLSearchParams(params);
			query.set("cursor", cursor);
			query.set("limit", "20");
			const response = await fetch(`${API_URL}/comments?${query.toString()}`);
			if (!response.ok) return;
			const json = await response.json();
			setComments((current) => [...current, ...(json.data || [])]);
			setCursor(json.next_cursor || null);
		} finally {
			setLoadingMore(false);
		}
	}, [cursor, loadingMore, params]);

	useEffect(() => {
		const target = loadMoreRef.current;
		if (!target || !cursor) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore();
				}
			},
			{ root: null, rootMargin: "200px", threshold: 0 },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [cursor, loadMore]);

	async function runPrediction() {
		if (!feedback.trim()) return;
		setPredicting(true);
		setPrediction(null);
		try {
			const response = await fetch(`${API_URL}/predict`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ feedback }),
			});
			const json = await response.json();
			setPrediction(json.prediction?.aspect_sentiments || null);
		} finally {
			setPredicting(false);
		}
	}

	function submitSearch(event: FormEvent) {
		event.preventDefault();
		setFilters((current) => ({ ...current, keyword: draftKeyword.trim() }));
	}

	function resetFilters() {
		setDraftKeyword("");
		setFilters(EMPTY_FILTERS);
	}

	function onPickImportFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] || null;
		setImportFile(file);
		setImportMessage("");
	}

	async function submitImport() {
		if (!importFile) {
			setImportMessage("Vui lòng chọn file Excel");
			return;
		}
		setImportBusy(true);
		setImportMessage("");
		try {
			const body = new FormData();
			body.append("file", importFile);
			const endpoint =
				importKind === "raw"
					? `${API_URL}/import`
					: `${API_URL}/import-labeled?mode=update`;
			const response = await fetch(endpoint, { method: "POST", body });
			const json = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(json.detail || json.error || "Tải lên thất bại");
			}
			if (json.message === "File already imported") {
				setImportMessage(
					`File này đã được nhập trước đó (${json.file_name || importFile.name}).`,
				);
			} else if (importKind === "raw") {
				setImportMessage(
					`Đã thêm ${json.inserted ?? 0} bản ghi mới trên tổng ${json.parsed ?? 0} dòng đọc được.`,
				);
			} else {
				setImportMessage(
					`Đã cập nhật nhãn cho ${json.updated ?? 0} bình luận, bỏ qua ${json.skipped ?? 0}.`,
				);
			}
			setImportFile(null);
			await loadDashboard();
			setActionMessage("Đã làm mới dữ liệu hiển thị.");
		} catch (importError) {
			setImportMessage(
				importError instanceof Error
					? importError.message
					: "Tải lên thất bại",
			);
		} finally {
			setImportBusy(false);
		}
	}

	async function downloadExport(mode: "labeling" | "training") {
		setExportBusy(mode);
		setActionMessage("");
		try {
			const response = await fetch(`${API_URL}/export?mode=${mode}`);
			if (!response.ok) {
				throw new Error("Không tải được file");
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download =
				mode === "labeling" ? "du_lieu_tho.xlsx" : "du_lieu_gan_nhan.xlsx";
			link.click();
			URL.revokeObjectURL(url);
			setActionMessage(
				mode === "labeling"
					? "Đã tải file dữ liệu thô, sẵn sàng để gán nhãn."
					: "Đã tải file dữ liệu đã gán nhãn.",
			);
		} catch (exportError) {
			setActionMessage(
				exportError instanceof Error
					? exportError.message
					: "Không tải được file",
			);
		} finally {
			setExportBusy("");
		}
	}

	async function runBatchPredict() {
		setPredictBatchBusy(true);
		setActionMessage("");
		try {
			const response = await fetch(`${API_URL}/model/predict?limit=200`, {
				method: "POST",
			});
			const json = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(json.detail || "Phân loại tự động thất bại");
			}
			setActionMessage(
				`Đã phân loại thêm ${json.updated ?? 0} bình luận chưa có nhãn.`,
			);
			await loadDashboard();
		} catch (predictError) {
			setActionMessage(
				predictError instanceof Error
					? predictError.message
					: "Phân loại tự động thất bại",
			);
		} finally {
			setPredictBatchBusy(false);
		}
	}

	return (
		<div className="w-full min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
			<div className="max-w-6xl mx-auto px-4 pt-10 pb-12">
				<div className="flex flex-row items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
							Khảo sát chất lượng giảng dạy
						</h1>
						<p className="mt-2 text-gray-500">
							Tra cứu ý kiến sinh viên theo học kỳ và theo dõi cảm xúc ở từng
							khía cạnh của môn học.
						</p>
					</div>
					<ThemeSwitcher />
				</div>

				<Card className="mt-6 w-full" shadow="sm">
					<CardBody className="gap-4">
						<div>
							<p className="text-sm font-medium text-gray-700 dark:text-gray-200">
								Phạm vi tra cứu
							</p>
							<p className="mt-1 text-xs text-gray-500">
								Chọn tiêu chí muốn xem.
							</p>
							{breadcrumb.length > 0 ? (
								<p className="mt-2 text-xs text-primary">
									{breadcrumb.join(" · ")}
								</p>
							) : (
								<p className="mt-2 text-xs text-gray-400">
									Đang xem toàn bộ dữ liệu.
								</p>
							)}
						</div>

						<form
							onSubmit={submitSearch}
							className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-4"
						>
							<Field label="Từ khóa" className="md:col-span-2 xl:col-span-4">
								<Input
									value={draftKeyword}
									onValueChange={setDraftKeyword}
									placeholder="Tìm trong bình luận..."
									variant="bordered"
									size="sm"
								/>
							</Field>

							{FILTER_FIELDS.map((item) => (
								<FilterSelect
									key={item.key}
									label={item.label}
									value={filters[item.key]}
									options={facets[item.facetKey] || []}
									renderLabel={
										item.key === "aspect"
											? (value) => ASPECT_LABELS[value] || value
											: item.key === "sentiment"
											? (value) => SENTIMENT_LABELS[value] || value
											: item.key === "semester"
											? (value) => `HK ${value}`
											: undefined
									}
									onChange={(value) => updateFilter(item.key, value)}
								/>
							))}

							<div className="flex flex-row gap-3 md:col-span-2 xl:col-span-4">
								<Button color="primary" type="submit" className="rounded-lg">
									Tìm kiếm
								</Button>
								<Button
									variant="ghost"
									type="button"
									onPress={resetFilters}
									className="rounded-lg"
								>
									Xóa bộ lọc
								</Button>
							</div>
						</form>
					</CardBody>
				</Card>

				<Card className="mt-4 w-full" shadow="sm">
					<CardBody className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
						<p className="mr-auto text-sm font-medium text-gray-700 dark:text-gray-200">
							Dữ liệu
						</p>
						<Button
							color="primary"
							variant="flat"
							className="rounded-lg"
							onPress={() => {
								setImportKind("raw");
								setImportFile(null);
								setImportMessage("");
								openImport();
							}}
						>
							Nhập dữ liệu khảo sát
						</Button>
						<Button
							variant="flat"
							className="rounded-lg"
							onPress={() => {
								setImportKind("labeled");
								setImportFile(null);
								setImportMessage("");
								openImport();
							}}
						>
							Nhập dữ liệu đã gán nhãn
						</Button>
						<Button
							variant="bordered"
							className="rounded-lg"
							isLoading={exportBusy === "labeling"}
							onPress={() => downloadExport("labeling")}
						>
							Xuất dữ liệu thô
						</Button>
						<Button
							variant="bordered"
							className="rounded-lg"
							isLoading={exportBusy === "training"}
							onPress={() => downloadExport("training")}
						>
							Xuất dữ liệu đã gán nhãn
						</Button>
						<Button
							color="secondary"
							variant="flat"
							className="rounded-lg"
							isLoading={predictBatchBusy}
							onPress={runBatchPredict}
						>
							Phân loại tự động
						</Button>
					</CardBody>
					{actionMessage ? (
						<p className="px-4 pb-3 text-sm text-gray-500">{actionMessage}</p>
					) : null}
				</Card>

				<Modal
					isOpen={importOpen}
					onOpenChange={onImportOpenChange}
					size="md"
					backdrop="blur"
					classNames={{
						backdrop: "bg-gray-900/50",
						base: "border border-default-200 shadow-2xl",
						header: "border-b border-default-100",
						footer: "border-t border-default-100",
					}}
				>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalHeader>
									{importKind === "raw"
										? "Nhập dữ liệu khảo sát"
										: "Nhập dữ liệu đã gán nhãn"}
								</ModalHeader>
								<ModalBody className="gap-3">
									<p className="text-sm text-gray-500">
										{importKind === "raw"
											? "Chọn file khảo sát xuất từ hệ thống: bảng ý kiến sinh viên hoặc bảng thống kê điểm. Hệ thống tự nhận dạng loại file."
											: "Chọn file đã gán nhãn thủ công (giữ nguyên cột mã bình luận, khía cạnh và cảm xúc) để cập nhật lại vào dữ liệu."}
									</p>
									<input
										type="file"
										accept=".xlsx,.xls,.csv"
										onChange={onPickImportFile}
										className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
									/>
									{importFile ? (
										<p className="text-sm text-gray-600">
											Đã chọn: {importFile.name}
										</p>
									) : null}
									{importMessage ? (
										<p className="text-sm text-primary">{importMessage}</p>
									) : null}
								</ModalBody>
								<ModalFooter>
									<Button variant="light" onPress={onClose}>
										Đóng
									</Button>
									<Button
										color="primary"
										isLoading={importBusy}
										onPress={submitImport}
									>
										Tải lên
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>

				{error ? (
					<Card
						className="mt-6 w-full border border-danger-200 bg-danger-50 dark:bg-danger-100/10"
						shadow="none"
					>
						<CardBody className="text-danger">
							{error}. Kiểm tra API tại {API_URL}.
						</CardBody>
					</Card>
				) : null}

				<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard label="Tổng lượt phân loại" value={totals.total} />
					<MetricCard
						label="Tích cực"
						value={totals.bySentiment.positive || 0}
						color={SENTIMENT_TEXT_COLORS.positive}
					/>
					<MetricCard
						label="Tiêu cực"
						value={totals.bySentiment.negative || 0}
						color={SENTIMENT_TEXT_COLORS.negative}
					/>
					<MetricCard
						label="Trung tính"
						value={totals.bySentiment.neutral || 0}
						color={SENTIMENT_TEXT_COLORS.neutral}
					/>
				</div>

				<h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
					Tổng quan cảm xúc
				</h2>
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<Card className="xl:col-span-2" shadow="sm">
						<CardHeader className="pb-0">
							<p className="font-medium">Cảm xúc theo học kỳ</p>
						</CardHeader>
						<CardBody>
							<ResponsiveContainer width="100%" height={320}>
								<BarChart data={semesterChart}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
									<YAxis
										stroke="#6b7280"
										fontSize={12}
										allowDecimals={false}
									/>
									<Tooltip
										formatter={(value, name) => [
											value,
											SENTIMENT_LABELS[String(name)] || name,
										]}
									/>
									<Legend
										formatter={(value) =>
											SENTIMENT_LABELS[String(value)] || value
										}
									/>
									{["positive", "negative", "neutral"].map((sentiment) => (
										<Bar
											key={sentiment}
											dataKey={sentiment}
											stackId="sentiment"
											fill={SENTIMENT_COLORS[sentiment]}
											radius={[2, 2, 0, 0]}
										/>
									))}
								</BarChart>
							</ResponsiveContainer>
						</CardBody>
					</Card>

					<Card shadow="sm">
						<CardHeader className="pb-0">
							<p className="font-medium">Phân bố khía cạnh</p>
						</CardHeader>
						<CardBody>
							<ResponsiveContainer width="100%" height={320}>
								<PieChart>
									<Pie
										data={aspectChart}
										dataKey="value"
										nameKey="label"
										innerRadius={55}
										outerRadius={100}
										paddingAngle={2}
										stroke="#ffffff"
										strokeWidth={2}
									>
										{aspectChart.map((item, index) => (
											<Cell
												key={item.name}
												fill={
													ASPECT_COLORS[item.name] ||
													ASPECT_FALLBACK_COLORS[
														index % ASPECT_FALLBACK_COLORS.length
													]
												}
											/>
										))}
									</Pie>
									<Tooltip />
									<Legend
										iconType="circle"
										wrapperStyle={{ fontSize: 12, lineHeight: "20px" }}
									/>
								</PieChart>
							</ResponsiveContainer>
						</CardBody>
					</Card>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
					<Card className="xl:col-span-2" shadow="sm">
						<CardHeader className="flex flex-row items-center justify-between">
							<p className="font-medium">Danh sách bình luận</p>
							<span className="text-sm text-gray-500">
								{loading ? (
									<Spinner size="sm" />
								) : (
									`${comments.length} kết quả đang hiển thị`
								)}
							</span>
						</CardHeader>
						<CardBody className="gap-3 pt-0">
							{comments.map((comment) => (
								<CommentCard key={comment._id} comment={comment} />
							))}
							{!loading && comments.length === 0 ? (
								<p className="py-10 text-center text-gray-500">
									Không có bình luận nào.
								</p>
							) : null}
							{cursor ? (
								<div
									ref={loadMoreRef}
									className="flex items-center justify-center py-4 text-sm text-gray-500"
									aria-hidden={!loadingMore}
								>
									{loadingMore ? (
										<span className="flex items-center gap-2">
											<Spinner size="sm" />
											Đang tải thêm...
										</span>
									) : (
										<span className="text-gray-400">Cuộn để xem thêm</span>
									)}
								</div>
							) : null}
							{!loading && !cursor && comments.length > 0 ? (
								<p className="py-3 text-center text-xs text-gray-400">
									Đã hiển thị hết kết quả
								</p>
							) : null}
						</CardBody>
					</Card>

					<Card className="h-fit" shadow="sm">
						<CardHeader className="flex flex-col items-start pb-0">
							<p className="font-medium">Thử phân loại</p>
							<p className="mt-1 text-sm text-gray-500">
								Nhập một bình luận để xem khía cạnh và cảm xúc được nhận diện.
							</p>
						</CardHeader>
						<CardBody className="gap-3">
							<Textarea
								value={feedback}
								onValueChange={setFeedback}
								placeholder="Ví dụ: Thầy nhiệt tình nhưng slide khá lỗi thời..."
								variant="bordered"
								minRows={6}
							/>
							<Button
								color="primary"
								onPress={runPrediction}
								isDisabled={!feedback.trim()}
								isLoading={predicting}
								className="rounded-lg"
							>
								Phân tích cảm xúc
							</Button>
							{prediction ? (
								<div className="flex flex-col gap-2">
									{Object.entries(prediction).map(([aspect, sentiment]) => (
										<div
											key={aspect}
											className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
										>
											<span className="text-xs font-medium">
												{ASPECT_LABELS[aspect] || aspect}
											</span>
											<SentimentChip value={sentiment} />
										</div>
									))}
								</div>
							) : null}
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}

function FilterSelect({
	label,
	value,
	options,
	onChange,
	renderLabel,
	placeholder = "Tất cả",
}: {
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
	renderLabel?: (value: string) => string;
	placeholder?: string;
}) {
	// A selection can fall outside the narrowed list; keep it visible so the
	// dropdown never renders blank while the value is still applied.
	const items = value && !options.includes(value) ? [value, ...options] : options;

	return (
		<Field label={label}>
			<select
				aria-label={label}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-8 w-full rounded-medium border-2 border-default-200 bg-transparent px-2 text-small text-foreground outline-none transition-colors hover:border-default-400 focus:border-default-foreground"
			>
				<option value="">{placeholder}</option>
				{items.map((option) => (
					<option key={option} value={option}>
						{renderLabel ? renderLabel(option) : option}
					</option>
				))}
			</select>
		</Field>
	);
}

function Field({
	label,
	className = "",
	children,
}: {
	label: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<label className="text-xs font-medium text-gray-600 dark:text-gray-300">
				{label}
			</label>
			{children}
		</div>
	);
}

function MetricCard({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color?: string;
}) {
	return (
		<Card shadow="sm">
			<CardBody>
				<p className="text-sm text-gray-500">{label}</p>
				<p
					className="mt-1 text-2xl font-semibold"
					style={color ? { color } : undefined}
				>
					{value.toLocaleString("vi-VN")}
				</p>
			</CardBody>
		</Card>
	);
}

function SentimentChip({ value = "unknown" }: { value?: string }) {
	const background = SENTIMENT_COLORS[value] || SENTIMENT_COLORS.unknown;
	return (
		<span
			className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-800"
			style={{ backgroundColor: background }}
		>
			{SENTIMENT_LABELS[value] || value}
		</span>
	);
}

function AspectChip({ aspect }: { aspect: string }) {
	return (
		<span
			className="rounded-md px-2 py-1 text-xs font-medium text-gray-800"
			style={{ backgroundColor: ASPECT_COLORS[aspect] || "#e2e8f0" }}
		>
			{ASPECT_LABELS[aspect] || aspect}
		</span>
	);
}

function CommentCard({ comment }: { comment: CommentDocument }) {
	const sentiment =
		comment.label?.sentiment || comment.predict?.sentiment || "unknown";
	const aspects = comment.label?.aspect || comment.predict?.aspect || [];
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
					<span>{comment.meta?.academic_year || "Không rõ năm"}</span>
					<span>·</span>
					<span>HK {comment.meta?.semester || "?"}</span>
					{comment.meta?.course ? (
						<>
							<span>·</span>
							<span>{comment.meta.course}</span>
						</>
					) : null}
					{comment.meta?.class ? (
						<>
							<span>·</span>
							<span>{comment.meta.class}</span>
						</>
					) : null}
				</div>
				<SentimentChip value={sentiment} />
			</div>
			<p className="mt-3 leading-7 text-gray-900 dark:text-gray-100">
				{comment.content?.comment || "(Bình luận trống)"}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{aspects.map((aspect) => (
					<AspectChip key={aspect} aspect={aspect} />
				))}
			</div>
		</div>
	);
}
