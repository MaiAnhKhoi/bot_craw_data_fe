"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getJob, listJobs } from "@/features/jobs/api/jobs-api";
import { STALE_TIME } from "@/lib/constants";
import type { JobListParams } from "@/features/jobs/types/job";

/*
 * Query key của module Jobs. Gom một chỗ để mutation (pause/resume/cancel) và
 * hook SSE nhắm đúng cache, không ai phải tự nặn mảng key rồi gõ sai.
 */
export const jobKeys = {
  all: ["jobs"] as const,
  list: (params: JobListParams) => ["jobs", "list", params] as const,
  detail: (id: number) => ["jobs", "detail", id] as const,
};

/*
 * Danh sách job, PHÂN TRANG Ở SERVER.
 * `placeholderData: keepPreviousData` giữ nguyên trang cũ trong lúc tải trang
 * mới — bảng không nháy trắng khi bấm sang trang.
 */
export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: ({ signal }) => listJobs(params, signal),
    staleTime: STALE_TIME.jobs,
    placeholderData: keepPreviousData,
  });
}

/*
 * Chi tiết một job. KHÔNG polling: tiến độ đã do SSE đẩy về và vá thẳng vào
 * cache này (xem use-job-events.ts).
 */
export function useJob(id: number) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: ({ signal }) => getJob(id, signal),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: STALE_TIME.jobs,
  });
}
