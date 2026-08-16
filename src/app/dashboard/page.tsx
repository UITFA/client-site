import SurveyDashboard from "@/components/dashboard/SurveyDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "UIT Feedback Analytics",
	description: "Dashboard phân tích khảo sát chất lượng giảng dạy UIT",
};

export default function DashboardPage() {
	return <SurveyDashboard />;
}
