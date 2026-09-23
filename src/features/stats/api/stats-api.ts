import { api } from "@/lib/api";
import type { Overview, WorkerStatus } from "@/features/stats/types/stats";

/*
 * Lớp API của module Thống kê (docs/API_CONTRACT.md §4).
 * Envelope đã được axios bóc, nên `response.data` là payload thật.
 */

export async function getOverview(signal?: AbortSignal): Promise<Overview> {
  const response = await api.get<Overview>("/stats/overview", { signal });
  return response.data;
}

export async function getWorkerStatus(
  signal?: AbortSignal,
): Promise<WorkerStatus> {
  const response = await api.get<WorkerStatus>("/stats/worker", { signal });
  return response.data;
}
