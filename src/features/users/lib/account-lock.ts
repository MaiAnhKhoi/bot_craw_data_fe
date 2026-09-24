import type { Account } from "@/features/users/types/user";

/*
 * Một tài khoản không đăng nhập được vì hai lý do KHÁC HẲN NHAU, và giao diện
 * phải nói đúng lý do nào:
 *
 * - `is_active = false`: admin chủ động khoá, nằm đó tới khi có người mở.
 * - `locked_until` còn hạn: hệ thống tự khoá sau một loạt lần nhập sai, TỰ HẾT
 *   sau vài phút.
 *
 * Gom việc phân định vào một hàm DUY NHẤT vì hai nơi cùng hỏi một câu: bảng vẽ
 * huy hiệu, hàng nút quyết định có hiện "Mở khoá" hay không. Mỗi chỗ tự so mốc
 * theo một kiểu là sinh ra cảnh huy hiệu bảo đang khoá tạm mà nút mở khoá lại
 * không hiện — lệch kiểu đó rất khó thấy khi đọc code.
 */

export type AccountLockState = "normal" | "temporary" | "disabled";

export function accountLockState(account: Account): AccountLockState {
  /*
   * Admin khoá thì XÉT TRƯỚC, kể cả khi tài khoản đồng thời đang dính khoá tạm:
   * khoá tạm có tự hết thì người dùng vẫn không vào được, nên nói "còn 5 phút"
   * lúc này là hứa một điều không xảy ra. Cũng vì vậy mà nút "Mở khoá" biến mất
   * ở đây — bấm nó chẳng giải quyết được gì.
   */
  if (!account.is_active) return "disabled";

  /*
   * Phải so với HIỆN TẠI chứ không chỉ kiểm tra `locked_until != null`: backend
   * giữ lại mốc của lần khoá gần nhất kể cả khi nó đã qua từ lâu, nên chỉ nhìn
   * "có giá trị hay không" thì một tài khoản khoá từ hôm qua sẽ mãi mãi hiện là
   * đang bị khoá.
   */
  if (account.locked_until) {
    const until = new Date(account.locked_until).getTime();
    if (!Number.isNaN(until) && until > Date.now()) return "temporary";
  }

  return "normal";
}
