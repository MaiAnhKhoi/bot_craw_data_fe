import { api } from "@/lib/api";
import type { Page } from "@/types/common";
import type {
  RemainingArea,
  RemainingAreaListParams,
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
