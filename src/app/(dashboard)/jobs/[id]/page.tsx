import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailScreen } from "@/features/jobs/components/job-detail/job-detail-screen";

export const metadata: Metadata = { title: "Chi tiết job" };

/*
 * `params` là Promise ở App Router hiện tại — phải await trước khi đọc.
 * `key` ép React dựng lại màn khi đổi job, nhờ đó hook SSE đóng kết nối cũ và
 * mở kết nối mới thay vì bám vào job trước đó.
 */
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) notFound();

  return <JobDetailScreen key={jobId} jobId={jobId} />;
}
