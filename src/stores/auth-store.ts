import { create } from "zustand";
import { ROLE_STORAGE_KEY, TOKEN_STORAGE_KEY } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

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
 *
 * VÌ SAO VAI TRÒ NẰM Ở ĐÂY, CẠNH TOKEN, chứ không chỉ trong cache TanStack:
 * hồ sơ người dùng là dữ liệu server và vẫn thuộc về TanStack Query (xem
 * use-current-user.ts) — nhưng giao diện cần biết vai trò NGAY Ở KHUNG HÌNH
 * ĐẦU TIÊN để dựng menu và các nút chỉ-admin. Cache Query rỗng lại sau mỗi lần
 * F5, nên nếu chỉ dựa vào nó thì admin sẽ thấy menu thiếu mục rồi mục đó nhảy
 * vào sau một vòng `/auth/me` — trông y hệt giao diện đang hỏng. Giá trị ở đây
 * là BẢN SAO để vẽ cho kịp; `/auth/me` vẫn là nguồn và ghi đè lại mỗi lần trả
 * về, còn chặn thật thì nằm ở backend.
 */

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/*
 * Đọc vai trò đã lưu. Bắt buộc KIỂM LẠI giá trị thay vì ép kiểu: localStorage
 * là thứ sửa bằng tay được, và một chuỗi rác lọt qua đây sẽ đi thẳng vào
 * `Record<UserRole, ...>` rồi tra ra `undefined` ngay chỗ vẽ huy hiệu.
 */
function readStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return value === "admin" || value === "sale" ? value : null;
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

function writeStoredRole(role: UserRole | null): void {
  if (typeof window === "undefined") return;
  try {
    if (role) window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    else window.localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // Bỏ qua: mất bản sao thì cùng lắm menu nháy một nhịp sau khi /auth/me về.
  }
}

interface AuthState {
  token: string | null;
  /**
   * Vai trò của phiên hiện tại; `null` nghĩa là CHƯA BIẾT — chưa đăng nhập,
   * hoặc phiên mở từ trước khi có phân quyền và `/auth/me` chưa trả lời.
   */
  role: UserRole | null;
  /**
   * Đã đọc xong localStorage chưa. Route guard phải CHỜ cờ này rồi mới quyết
   * định đẩy về /login — nếu không, mỗi lần F5 màn sẽ nháy qua /login.
   */
  hydrated: boolean;
  hydrate: () => void;
  /** Đăng nhập xong: ghi token và vai trò trong CÙNG một lần cập nhật. */
  setSession: (token: string, role: UserRole | null) => void;
  /** Đồng bộ lại vai trò theo `/auth/me` — nguồn sự thật duy nhất. */
  setRole: (role: UserRole | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  hydrated: false,
  hydrate: () =>
    set({ token: readStoredToken(), role: readStoredRole(), hydrated: true }),
  setSession: (token, role) => {
    writeStoredToken(token);
    writeStoredRole(role);
    set({ token, role, hydrated: true });
  },
  setRole: (role) => {
    writeStoredRole(role);
    set({ role });
  },
  clear: () => {
    writeStoredToken(null);
    writeStoredRole(null);
    set({ token: null, role: null, hydrated: true });
  },
}));
