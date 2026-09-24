import type { UserRole } from "@/types/domain";

/* Kiểu của module Auth — khớp docs/API_CONTRACT.md §1. */

export type { UserRole };

export interface User {
  id: number;
  username: string;
  full_name: string | null;
  is_active: boolean;
  /**
   * Quyết định người này ĐẶT ĐƯỢC LỆNH QUÉT hay chỉ đọc dữ liệu. Giao diện đọc
   * nó để bớt nút cho gọn mắt; chặn thật vẫn là 403 từ backend.
   */
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/*
 * Tự đổi mật khẩu của CHÍNH MÌNH — ai đăng nhập cũng gọi được, kể cả sale.
 *
 * Khác hẳn `POST /users/{id}/password` (admin đặt lại hộ người khác): ở đây
 * backend bắt khai mật khẩu hiện tại, nên một máy bỏ quên chưa đăng xuất cũng
 * không đổi được mật khẩu của người đang đăng nhập trên đó.
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
