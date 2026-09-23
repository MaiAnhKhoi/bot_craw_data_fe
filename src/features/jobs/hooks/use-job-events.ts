"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { jobEventsUrl } from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/use-jobs";
import { useAuthStore } from "@/stores/auth-store";
import type {
  JobDetail,
  JobDoneEvent,
  JobProgressEvent,
} from "@/features/jobs/types/job";

/*
 * Tiến độ job theo thời gian thực qua SSE (docs/API_CONTRACT.md §2).
 *
 * Vì sao SSE chứ không polling: backend đã đẩy mỗi 2 giây, polling 2 giây từ
 * nhiều tab là tự nhân tải lên vô ích. Nhờ đó query chi tiết job KHÔNG cần
 * `refetchInterval` (Rule 1 — không polling vô tội vạ).
 *
 * Hook này KHÔNG giữ dữ liệu trong state riêng: nó vá thẳng vào cache TanStack
 * Query của `jobKeys.detail(id)`, nên mọi component đang đọc job đó — bảng tiến
 * độ, nút pause/resume, tiêu đề — cùng cập nhật một lượt và không có hai nguồn
 * sự thật.
 *
 * Vòng đời được quản đủ ba tình huống:
 * - `event: done`  → đóng hẳn kết nối, KHÔNG thử lại (job đã kết thúc).
 * - mất kết nối    → tự thử lại với backoff luỹ thừa, tối đa 30 giây/lần.
 * - unmount        → huỷ timer đang chờ + đóng EventSource, tránh rò kết nối
 *                    khi người dùng nhảy qua lại giữa các job.
 */

const MAX_RETRY_DELAY_MS = 30_000;

function parseEventData<T>(event: Event): T | null {
  const data = (event as MessageEvent<string>).data;
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    // Gói tin hỏng thì bỏ qua — gói kế tiếp (2 giây sau) sẽ bù lại.
    return null;
  }
}

export interface JobEventsState {
  /** Kết nối SSE đang mở. */
  connected: boolean;
  /** Đã nhận `event: done` — job kết thúc, không còn luồng nào chạy. */
  finished: boolean;
}

export function useJobEvents(jobId: number): JobEventsState {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [connected, setConnected] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!token || !Number.isFinite(jobId) || jobId <= 0) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let attempt = 0;

    const closeSource = () => {
      source?.close();
      source = null;
    };

    const connect = () => {
      if (stopped) return;
      const eventSource = new EventSource(jobEventsUrl(jobId, token));
      source = eventSource;

      eventSource.addEventListener("open", () => {
        attempt = 0;
        setConnected(true);
      });

      eventSource.addEventListener("progress", (event) => {
        const payload = parseEventData<JobProgressEvent>(event);
        if (!payload) return;
        queryClient.setQueryData<JobDetail>(
          jobKeys.detail(jobId),
          // Vá từng trường: payload chỉ chứa phần tiến độ, thay cả object sẽ
          // xoá mất name/params/queries của bản chi tiết.
          (previous) => (previous ? { ...previous, ...payload } : previous),
        );
      });

      eventSource.addEventListener("done", (event) => {
        const payload = parseEventData<JobDoneEvent>(event);
        if (payload) {
          queryClient.setQueryData<JobDetail>(jobKeys.detail(jobId), (previous) =>
            previous ? { ...previous, status: payload.status } : previous,
          );
        }
        stopped = true;
        closeSource();
        setConnected(false);
        setFinished(true);
        // Nạp lại bản đầy đủ: thời gian kết thúc và trạng thái từng truy vấn
        // con không nằm trong gói `done`.
        queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      });

      eventSource.onerror = () => {
        closeSource();
        setConnected(false);
        if (stopped) return;
        attempt += 1;
        const delay = Math.min(
          MAX_RETRY_DELAY_MS,
          1_000 * 2 ** Math.min(attempt - 1, 5),
        );
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      closeSource();
      setConnected(false);
    };
  }, [jobId, token, queryClient]);

  return { connected, finished };
}
