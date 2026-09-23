import type { Metadata } from "next";
import { JobsScreen } from "@/features/jobs/components/jobs/jobs-screen";

export const metadata: Metadata = { title: "Job quét" };

export default function JobsPage() {
  return <JobsScreen />;
}
