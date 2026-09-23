import { api } from "@/lib/api";
import type { Page } from "@/types/common";
import type { Job } from "@/features/jobs/types/job";
import type {
  RemainingArea,
  RemainingAreaListParams,
  RemainingSplitRequest,
  SplitPlan,
} from "@/features/remaining-areas/types/remaining-area";

/*
 * Lớp API của trang Địa bàn còn sót (docs/API_CONTRACT.md §2).
 * Component không gọi thẳng — luôn đi qua hook trong hooks/.
 */

export async function listRemainingAreas(
  params: RemainingAreaListParams,
  signal?: AbortSignal,
): Promise<Page<RemainingArea>> {
  const response = await api.get<Page<RemainingArea>>("/jobs/remaining-areas", {
    params,
    signal,
  });
  return response.data;
}

/*
 * Xem trước và tạo dùng CÙNG một payload, khác đúng một chỗ: cái đầu không ghi
 * gì. Nhờ vậy con số hiện ra trước khi bấm chính là con số sẽ chạy — nếu hai
 * bên tính theo hai đường thì bản xem trước chỉ là lời hứa suông.
 */
export async function previewSplit(
  input: RemainingSplitRequest,
  signal?: AbortSignal,
): Promise<SplitPlan> {
  const response = await api.post<SplitPlan>(
    "/jobs/remaining-areas/split-preview",
    input,
    { signal },
  );
  return response.data;
}

export async function createSplitJob(
  input: RemainingSplitRequest,
): Promise<Job> {
  const response = await api.post<Job>("/jobs/remaining-areas/split", input);
  return response.data;
}
