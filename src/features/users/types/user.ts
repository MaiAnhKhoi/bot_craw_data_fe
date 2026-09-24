import type { PageParams } from "@/types/common";
import type { UserRole } from "@/types/domain";

/* Kiểu của module Quản lý tài khoản — khớp docs/API_CONTRACT.md §1. */

export type { UserRole };

/*
 * Một dòng trong bảng quản lý tài khoản.
 *
 * CỐ Ý không dùng lại `User` của module Auth: `User` là hồ sơ của CHÍNH MÌNH mà
 * `/auth/me` trả về, còn đây là bản ghi người khác do admin quản lý — nó có
 * thêm `created_at`, và quan trọng hơn là hai thứ này đổi vì những lý do khác
 * nhau. Gộp làm một thì mỗi lần backend thêm trường cho màn quản trị là màn
 * đăng nhập cũng phải sửa theo.
 */
export interface Account {
  id: number;
  username: string;
  full_name: string | null;
  role: UserRole;
  /** `false` = đã khoá: còn nguyên dữ liệu nhưng không đăng nhập được nữa. */
  is_active: boolean;
  created_at: string;
  /*
   * Mốc ISO hết KHOÁ TẠM, `null` là không bị khoá.
   *
   * Khác hẳn `is_active = false` dù người dùng cũng không vào được: cái kia là
   * quyết định của admin và chỉ admin mới gỡ, còn cái này là hệ thống tự khoá
   * sau một loạt lần nhập sai và TỰ HẾT khi tới mốc này. Gộp hai thứ vào một
   * chữ "đã khoá" là bắt admin đi gỡ một cái khoá vốn sắp tự rơi ra.
   *
   * Lý do có nó: hệ thống sắp mở ra Internet qua Cloudflare Tunnel, mà không
   * giới hạn thì dò được 20 lần/giây — mật khẩu kiểu `sale2026` rụng dưới 5
   * phút.
   */
  locked_until: string | null;
  /** Số lần nhập sai LIÊN TIẾP; về 0 khi đăng nhập được hoặc admin mở khoá. */
  failed_attempts: number;
}

export interface AccountCreate {
  username: string;
  password: string;
  full_name?: string;
  role: UserRole;
}

/*
 * Sửa tài khoản: mọi trường đều TUỲ CHỌN vì backend chỉ đụng vào thứ được gửi.
 * Không có `username` — tên đăng nhập là thứ người ta gõ hằng ngày và là khoá
 * để dò lại lịch sử, đổi nó thì lợi bất cập hại.
 */
export interface AccountUpdate {
  full_name?: string | null;
  role?: UserRole;
  is_active?: boolean;
}

export type AccountListParams = PageParams;
