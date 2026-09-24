import { api } from "@/lib/api";
import type { Page } from "@/types/common";
import type {
  Account,
  AccountCreate,
  AccountListParams,
  AccountUpdate,
} from "@/features/users/types/user";

/*
 * Lớp API của module Quản lý tài khoản (docs/API_CONTRACT.md §1).
 *
 * MỌI endpoint dưới đây chỉ admin gọi được — tài khoản sale nhận 403. Giao diện
 * có ẩn menu đi thì cũng chỉ là cho gọn mắt; đây mới là nơi ghi rõ rằng backend
 * là chỗ chặn thật, để sau này không ai tưởng ẩn nút là đã an toàn.
 *
 * Component không gọi thẳng — luôn đi qua hook trong features/users/hooks/.
 */

export async function listUsers(
  params: AccountListParams,
  signal?: AbortSignal,
): Promise<Page<Account>> {
  const response = await api.get<Page<Account>>("/users", { params, signal });
  return response.data;
}

export async function createUser(input: AccountCreate): Promise<Account> {
  const response = await api.post<Account>("/users", input);
  return response.data;
}

export async function updateUser(
  id: number,
  input: AccountUpdate,
): Promise<Account> {
  const response = await api.patch<Account>(`/users/${id}`, input);
  return response.data;
}

/*
 * Admin đặt lại mật khẩu cho người khác — KHÔNG cần mật khẩu cũ, vì tình huống
 * dùng đến nó luôn là "nhân viên quên mật khẩu".
 *
 * Không trả về gì đáng dùng: mật khẩu mới là thứ admin vừa tự gõ ra, đọc lại
 * từ server chẳng để làm gì.
 */
export async function resetUserPassword(
  id: number,
  newPassword: string,
): Promise<void> {
  await api.post(`/users/${id}/password`, { new_password: newPassword });
}

/*
 * Gỡ KHOÁ TẠM ngay lập tức (`{ "unlocked": true }`).
 *
 * Khoá tạm vốn tự hết sau vài phút, nên đây là lối tắt cho đúng một tình huống:
 * nhân viên đang cần vào gấp và ngồi ngay đó để xác nhận chính họ vừa gõ sai.
 * Không trả về `Account` nên nơi gọi phải nạp lại danh sách — mốc hết khoá đổi
 * là chuyện của server, đoán ở client thì bảng nói một đằng, backend một nẻo.
 */
export async function unlockUser(id: number): Promise<void> {
  await api.post(`/users/${id}/unlock`);
}
