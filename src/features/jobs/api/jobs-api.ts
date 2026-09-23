import { api, buildApiUrl } from "@/lib/api";
import type { Page } from "@/types/common";
import type {
  Job,
  JobCreate,
  JobDetail,
  JobListParams,
} from "@/features/jobs/types/job";

/*
 * Lớp API của module Jobs (docs/API_CONTRACT.md §2).
 * Component không gọi thẳng — luôn đi qua hook trong features/jobs/hooks/.
 */

export async function listJobs(
  params: JobListParams,
  signal?: AbortSignal,
): Promise<Page<Job>> {
  const response = await api.get<Page<Job>>("/jobs", { params, signal });
  return response.data;
}

export async function getJob(
  id: number,
  signal?: AbortSignal,
): Promise<JobDetail> {
  const response = await api.get<JobDetail>(`/jobs/${id}`, { signal });
  return response.data;
}

export async function createJob(input: JobCreate): Promise<Job> {
  const response = await api.post<Job>("/jobs", input);
  return response.data;
}

/** Ba hành động điều khiển job. Gọi sai trạng thái → backend trả JOB_INVALID_STATE. */
export type JobAction = "pause" | "resume" | "cancel";

export async function runJobAction(id: number, action: JobAction): Promise<Job> {
  const response = await api.post<Job>(`/jobs/${id}/${action}`);
  return response.data;
}

/*
 * URL cho EventSource của màn chi tiết job.
 *
 * EventSource KHÔNG gắn được header nên token phải nằm ở query param; backend
 * chỉ chấp nhận điều này trên cùng origin, tức là đi qua rewrite `/api/*` của
 * Next (docs/API_CONTRACT.md §2). Không bao giờ dựng URL tuyệt đối tới backend
 * ở đây — làm thế là vừa lộ token qua origin khác vừa dính CORS.
 */
export function jobEventsUrl(id: number, token: string): string {
  return buildApiUrl(`/jobs/${id}/events`, { token });
}
