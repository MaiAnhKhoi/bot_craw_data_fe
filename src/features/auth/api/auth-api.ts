import { api } from "@/lib/api";
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  User,
} from "@/features/auth/types/auth";

/*
 * Lớp API của module Auth — nơi DUY NHẤT chạm tới endpoint /auth/*.
 * Component không gọi thẳng vào đây; chúng đi qua hook trong features/auth/hooks/.
 * Envelope đã được axios bóc sẵn nên `response.data` chính là payload.
 *
 * Viết tay theo docs/API_CONTRACT.md vì backend chưa chạy lúc dựng FE; khi có
 * OpenAPI thì `npm run api:sync` sẽ thay thế (xem README §Đồng bộ Orval).
 */

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", input);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}

/*
 * Tự đổi mật khẩu. KHÔNG trả về token mới — phiên hiện tại vẫn chạy tiếp, nên
 * sau khi đổi ta không đá người dùng về màn đăng nhập.
 */
export async function changePassword(
  input: ChangePasswordRequest,
): Promise<void> {
  await api.post("/auth/change-password", input);
}
