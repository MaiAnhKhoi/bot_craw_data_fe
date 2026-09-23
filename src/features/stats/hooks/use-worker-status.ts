"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkerStatus } from "@/features/stats/api/stats-api";
import { STALE_TIME } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Trạng thái worker cho huy hiệu trên header.
 *
 * Đây là NGOẠI LỆ duy nhất được phép polling: huy hiệu nằm ở khung app, không
 * thuộc job nào nên không có SSE để bám. 30 giây một nhịp là đủ để biết worker
 * còn sống mà không tạo tải đáng kể. Dừng hẳn khi tab bị ẩn — `refetchInterval`
 * của TanStack Query chỉ chạy khi cửa sổ đang focus theo mặc định.
 */
export function useWorkerStatus() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["stats", "worker"],
    queryFn: ({ signal }) => getWorkerStatus(signal),
    enabled: !!token,
    staleTime: STALE_TIME.worker,
    refetchInterval: STALE_TIME.worker,
  });
}
