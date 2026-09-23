"use client";

import { useQuery } from "@tanstack/react-query";
import { getOverview } from "@/features/stats/api/stats-api";
import { STALE_TIME } from "@/lib/constants";

/*
 * Số liệu tổng quan cho màn Dashboard.
 * staleTime 30s: đây là số tổng hợp, không phải tiến độ realtime — mở lại màn
 * trong vòng 30 giây thì dùng cache, không gọi lại backend (Rule 1).
 */
export function useOverview() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: ({ signal }) => getOverview(signal),
    staleTime: STALE_TIME.stats,
  });
}
