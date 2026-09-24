import { z } from "zod";
import { passwordField } from "@/features/auth/schemas/change-password-schema";
import type { AccountCreate, AccountUpdate } from "@/features/users/types/user";

/*
 * Nguồn chân lý DUY NHẤT cho validation ba form của màn Quản lý tài khoản.
 *
 * Schema mô tả thứ người dùng GÕ, không phải DTO gửi đi — đổi sang DTO là việc
 * của `toAccountCreate` / `toAccountUpdate` bên dưới, tách ra để thông điệp lỗi
 * luôn trỏ đúng ô trên màn hình.
 *
 * Quy tắc về mật khẩu dùng chung với form tự đổi mật khẩu (`passwordField`):
 * hai chỗ đặt hai ngưỡng khác nhau là kiểu lỗi không ai phát hiện ra cho tới
 * khi có người phàn nàn.
 */

const roleField = z.enum(["admin", "sale"], {
  message: "Chọn vai trò.",
});

const fullNameField = z.string().trim().max(120, "Họ tên tối đa 120 ký tự.");

export const createUserSchema = z.object({
  /*
   * Chặn dấu tiếng Việt và khoảng trắng ngay tại ô nhập: tên đăng nhập là thứ
   * gõ hằng ngày, có dấu thì gõ trên điện thoại là sai chính tả liên miên, mà
   * người dùng chỉ thấy "sai tên đăng nhập hoặc mật khẩu".
   */
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập tối thiểu 3 ký tự.")
    .max(50, "Tên đăng nhập tối đa 50 ký tự.")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Chỉ dùng chữ không dấu, số và các ký tự . _ -",
    ),
  password: passwordField,
  full_name: fullNameField,
  role: roleField,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const CREATE_USER_DEFAULTS: CreateUserInput = {
  username: "",
  password: "",
  full_name: "",
  /* Mặc định là sale: vai trò cấp thêm quyền phải do người tạo chọn có ý thức. */
  role: "sale",
};

export const updateUserSchema = z.object({
  full_name: fullNameField,
  role: roleField,
  is_active: z.boolean(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/*
 * Đặt lại mật khẩu hộ người khác. Có ô nhập lại vì admin gõ một mật khẩu mà
 * CHÍNH MÌNH KHÔNG dùng — gõ lệch một ký tự thì không ai phát hiện ra cho tới
 * lúc nhân viên báo không đăng nhập được.
 */
export const resetPasswordSchema = z
  .object({
    new_password: passwordField,
    confirm_password: z.string().min(1, "Nhập lại mật khẩu mới."),
  })
  .refine((input) => input.new_password === input.confirm_password, {
    message: "Nhập lại không khớp với mật khẩu mới.",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const RESET_PASSWORD_DEFAULTS: ResetPasswordInput = {
  new_password: "",
  confirm_password: "",
};

/*
 * Họ tên để trống thì KHÔNG gửi trường đó lên: backend hiểu vắng mặt là "không
 * có họ tên", còn chuỗi rỗng thì nó lưu nguyên và bảng hiện ra một ô trắng
 * trông như dữ liệu hỏng.
 */
export function toAccountCreate(input: CreateUserInput): AccountCreate {
  const fullName = input.full_name.trim();
  return {
    username: input.username.trim(),
    password: input.password,
    full_name: fullName.length > 0 ? fullName : undefined,
    role: input.role,
  };
}

/*
 * Sửa tài khoản thì NGƯỢC LẠI: họ tên rỗng gửi `null` chứ không phải bỏ trường
 * đi — người dùng vừa cố ý xoá đi thì phải xoá thật, mà `undefined` nghĩa là
 * "đừng đụng vào" nên nó sẽ giữ nguyên tên cũ.
 */
export function toAccountUpdate(input: UpdateUserInput): AccountUpdate {
  const fullName = input.full_name.trim();
  return {
    full_name: fullName.length > 0 ? fullName : null,
    role: input.role,
    is_active: input.is_active,
  };
}
