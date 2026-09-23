import type { Metadata } from "next";
import { DashboardScreen } from "@/features/stats/components/dashboard/dashboard-screen";

export const metadata: Metadata = { title: "Tổng quan" };

/* Route chỉ render component của feature — không fetch, không logic ở đây. */
export default function DashboardPage() {
  return <DashboardScreen />;
}
