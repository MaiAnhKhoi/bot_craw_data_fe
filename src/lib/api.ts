import axios from "axios";
import { API_PREFIX, ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiEnvelope } from "@/types/common";

/*
 * Axios instance DUY NHẤT của app (không component nào được gọi axios/fetch thẳng).
 *
 * - `baseURL: "/api/v1"` → trình duyệt gọi SAME-ORIGIN; Next rewrite `/api/*` sang
 *   FastAPI (xem next.config.ts) nên không bao giờ dính CORS.
 * - Request interceptor gắn `Authorization: Bearer <token>` lấy từ auth store.
 * - Response interceptor BÓC ENVELOPE `{ success, data, error }`: feature chỉ nhận
 *   payload bên trong, và `success === false` được ném thành `ApiError{code,message}`
 *   để UI hiển thị đúng mã lỗi backend thay vì đoán theo chuỗi.
 * - 401 → xoá token + chuyển hướng /login (phiên đã hết, không có refresh flow).
 */

/** Lỗi chuẩn hoá của tầng API — luôn có `code` theo docs/API_CONTRACT.md. */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/*
 * Serialize query params theo kiểu backend đọc được:
 * - bỏ qua undefined/null/chuỗi rỗng (để không gửi `?q=` vô nghĩa),
 * - LẶP key cho mảng (`?liveness=ACTIVE&liveness=SUSPECT`) đúng như contract,
 * - boolean thành "true"/"false".
 */
export function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        search.append(key, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

export const api = axios.create({
  baseURL: API_PREFIX,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
  paramsSerializer: serializeParams,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*
 * Phiên hết hạn: xoá token và đẩy về /login. Kiểm tra pathname trước khi
 * chuyển hướng để không tự đá chính mình khi đang đứng ở /login.
 */
function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  useAuthStore.getState().clear();
  if (!window.location.pathname.startsWith(ROUTES.login)) {
    window.location.href = ROUTES.login;
  }
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return typeof body === "object" && body !== null && "success" in body;
}

api.interceptors.response.use(
  (response) => {
    const body: unknown = response.data;
    if (isEnvelope(body)) {
      if (body.success === false) {
        const code = body.error?.code ?? "INTERNAL_ERROR";
        if (code === "UNAUTHORIZED") handleUnauthorized();
        throw new ApiError(
          code,
          body.error?.message ?? "Máy chủ trả về lỗi không xác định.",
          response.status,
        );
      }
      response.data = body.data;
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body: unknown = error.response?.data;
      const envelope = isEnvelope(body) ? body : undefined;

      if (status === 401) handleUnauthorized();

      const code =
        envelope?.error?.code ??
        (error.code === "ERR_NETWORK" ? "NETWORK_ERROR" : "INTERNAL_ERROR");
      const message =
        envelope?.error?.message ??
        (error.code === "ERR_NETWORK"
          ? "Không kết nối được máy chủ."
          : error.message);

      return Promise.reject(new ApiError(code, message, status));
    }
    return Promise.reject(error);
  },
);

/** Thông điệp đọc được cho mọi loại lỗi — dùng ở toast và các state lỗi. */
export function errorMessage(error: unknown, fallback = "Đã có lỗi xảy ra."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/*
 * Dựng URL same-origin dưới `/api/v1` cho những thứ KHÔNG đi qua axios:
 * tải file (thẻ <a download>) và EventSource (SSE). Cả hai đều không gắn được
 * header nên token phải đi kèm ở query param — backend chỉ chấp nhận điều đó
 * trên cùng origin, tức là qua rewrite của Next (docs/API_CONTRACT.md §2).
 */
export function buildApiUrl(
  path: string,
  params: Record<string, unknown> = {},
): string {
  const query = serializeParams(params);
  return query ? `${API_PREFIX}${path}?${query}` : `${API_PREFIX}${path}`;
}
