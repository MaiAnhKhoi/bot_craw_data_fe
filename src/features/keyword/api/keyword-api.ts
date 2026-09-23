import { api } from "@/lib/api";
import type {
  AiStatus,
  LocalizeRequest,
  LocalizeResponse,
  PlanResponse,
  SaveRequest,
  SaveResponse,
} from "@/features/keyword/types";

/*
 * Lớp API của module Từ khoá bản địa.
 *
 * Envelope `{success,data,error}` đã được axios bóc (lib/api.ts) nên
 * `response.data` ở đây là payload thật. Component KHÔNG gọi thẳng các hàm này —
 * luôn đi qua hook trong features/keyword/hooks/.
 *
 * `/keywords/localize` là endpoint DUY NHẤT trong app tiêu tiền AI, nên nó chỉ
 * được gọi khi người dùng bấm nút — không bao giờ tự chạy lúc mở form, không
 * bọc trong `useQuery` (xem hooks/use-keywords.ts).
 */

export async function getAiStatus(signal?: AbortSignal): Promise<AiStatus> {
  const response = await api.get<AiStatus>("/keywords/status", { signal });
  return response.data;
}

/*
 * Xem trước lượt dịch. Ngược hẳn với `/localize`: endpoint này KHÔNG chạm tới AI
 * (chỉ đếm quốc gia và tra bộ nhớ đệm) nên gọi lại thoải mái, và vì thế nó được
 * bọc trong `useQuery` chứ không phải mutation.
 */
export async function planKeywords(
  request: LocalizeRequest,
  signal?: AbortSignal,
): Promise<PlanResponse> {
  const response = await api.post<PlanResponse>("/keywords/plan", request, {
    signal,
  });
  return response.data;
}

/*
 * Không bao giờ ném lỗi vì AI: backend đã cam kết chưa cấu hình khoá / sai khoá /
 * quá hạn mức đều trả về từ khoá gốc kèm `warning` (API_CONTRACT §6). Lỗi ném ra
 * từ đây chỉ có thể là mất mạng hoặc hết phiên.
 */
export async function localizeKeywords(
  request: LocalizeRequest,
): Promise<LocalizeResponse> {
  const response = await api.post<LocalizeResponse>(
    "/keywords/localize",
    request,
  );
  return response.data;
}

/** Ghi đè bản của một quốc gia bằng bản người dùng sửa tay (AI không ghi đè lại). */
export async function saveKeywords(
  request: SaveRequest,
): Promise<SaveResponse> {
  const response = await api.post<SaveResponse>("/keywords/save", request);
  return response.data;
}
