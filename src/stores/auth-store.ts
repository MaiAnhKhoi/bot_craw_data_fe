import { create } from "zustand";
import { TOKEN_STORAGE_KEY } from "@/lib/constants";

/*
 * Auth client state cho công cụ nội bộ bot_craw_data.
 *
 * Token lưu localStorage (khoá `bcd_token`) vì backend chỉ phát access token
 * dài hạn, không có refresh-token cookie (xem docs/API_CONTRACT.md §1) — và
 * endpoint SSE cần token đọc được từ JS để gắn vào query param.
 *
 * Mọi truy cập localStorage đều bọc try/catch: trình duyệt ở chế độ ẩn danh
 * hoặc chặn cookie/site-data sẽ NÉM lỗi ngay khi đọc, và một lỗi ở đây không
 * được phép làm trắng cả app.
 *
 * Store khởi tạo `token: null` rồi mới nạp từ localStorage trong `hydrate()`
 * (gọi ở SessionProvider). Đọc thẳng lúc khởi tạo module sẽ khiến HTML server
 * (không có token) khác DOM client (có token) → hydration mismatch.
 */

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Bỏ qua: không ghi được thì phiên chỉ sống trong tab hiện tại.
  }
}

interface AuthState {
  token: string | null;
  /**
   * Đã đọc xong localStorage chưa. Route guard phải CHỜ cờ này rồi mới quyết
   * định đẩy về /login — nếu không, mỗi lần F5 màn sẽ nháy qua /login.
   */
  hydrated: boolean;
  hydrate: () => void;
  setToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,
  hydrate: () => set({ token: readStoredToken(), hydrated: true }),
  setToken: (token) => {
    writeStoredToken(token);
    set({ token, hydrated: true });
  },
  clear: () => {
    writeStoredToken(null);
    set({ token: null, hydrated: true });
  },
}));
