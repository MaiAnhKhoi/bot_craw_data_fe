"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getJob, listJobs } from "@/features/jobs/api/jobs-api";
import { useWorkerStatus } from "@/features/stats/hooks/use-worker-status";
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
 *
 * Tự làm mới 5 giây/lần KHI worker đang chạy job. Không phải để nhìn cho vui:
 * bảng này vẽ ra các nút Tạm dừng / Chạy tiếp / Huỷ theo TRẠNG THÁI ĐANG CACHE.
 * Job chạy xong ở server mà bảng chưa biết thì nút "Tạm dừng" vẫn nằm đó, bấm
 * vào là backend trả 409 JOB_INVALID_STATE — người dùng thấy một lỗi đỏ cho một
 * thao tác hoàn toàn hợp lý về mặt họ nhìn thấy. (Đã xảy ra thật.)
 *
 * Worker rảnh thì không có job nào đổi trạng thái được, nên ngừng hỏi.
 * Trang chi tiết job KHÔNG cần cái này — nó đã có SSE riêng.
 */
export function useJobs(params: JobListParams) {
  const worker = useWorkerStatus();
  const dangChay = worker.data?.current_job_id != null;

  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: ({ signal }) => listJobs(params, signal),
    staleTime: STALE_TIME.jobs,
    placeholderData: keepPreviousData,
    refetchInterval: dangChay ? 5_000 : false,
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
