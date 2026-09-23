import { api } from "@/lib/api";
import type {
  ExpandRequest,
  ExpandResponse,
  GeoCountry,
  GeoItem,
} from "@/features/geo/types";

/*
 * Lớp API của module Địa giới hành chính.
 *
 * Envelope `{success,data,error}` đã được axios bóc (lib/api.ts), nên
 * `response.data` ở đây là payload thật. Component không gọi thẳng các hàm này —
 * luôn đi qua hook trong features/geo/hooks/.
 *
 * Tham số `q` là bộ lọc PHÍA SERVER (khớp cả khi gõ không dấu). Bộ chọn trên màn
 * hình KHÔNG dùng nó: mỗi cấp nhiều nhất ~250 mục nên tải một lần theo cấp cha
 * rồi lọc tại chỗ vẫn nhanh hơn bắn một request mỗi phím gõ (Rule 1). Giữ tham
 * số ở đây vì nó thuộc hợp đồng của endpoint và cần cho màn hình khác sau này.
 */

export async function listContinents(signal?: AbortSignal): Promise<GeoItem[]> {
  const response = await api.get<GeoItem[]>("/geo/continents", { signal });
  return response.data;
}

export async function listCountries(
  params: { continent?: string | null; q?: string } = {},
  signal?: AbortSignal,
): Promise<GeoCountry[]> {
  const response = await api.get<GeoCountry[]>("/geo/countries", {
    params,
    signal,
  });
  return response.data;
}

export async function listProvinces(
  params: { country: string; q?: string },
  signal?: AbortSignal,
): Promise<GeoItem[]> {
  const response = await api.get<GeoItem[]>("/geo/provinces", {
    params,
    signal,
  });
  return response.data;
}

/** Chỉ Việt Nam có dữ liệu cấp này; nước khác trả về mảng rỗng. */
export async function listWards(
  params: { province: string; q?: string },
  signal?: AbortSignal,
): Promise<GeoItem[]> {
  const response = await api.get<GeoItem[]>("/geo/wards", { params, signal });
  return response.data;
}

/*
 * Biến lựa chọn theo cấp thành danh sách chuỗi địa điểm cụ thể.
 *
 * Tính ở SERVER chứ không ở trình duyệt: chọn "tất cả" ở cấp phường/xã ra hơn
 * 3.000 dòng, để client tự nhân tổ hợp thì phải tải nguyên cây địa giới về máy
 * chỉ để ghép chuỗi. Là POST vì lựa chọn có 4 trường, nhưng bản chất chỉ ĐỌC —
 * nên tầng hook bọc nó bằng `useQuery` để có cache.
 */
export async function expandLocations(
  request: ExpandRequest,
  signal?: AbortSignal,
): Promise<ExpandResponse> {
  const response = await api.post<ExpandResponse>("/geo/expand", request, {
    signal,
  });
  return response.data;
}
