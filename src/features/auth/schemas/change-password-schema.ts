import { z } from "zod";

/*
 * Độ dài tối thiểu của mật khẩu MỚI, dùng chung cho cả form tự đổi mật khẩu và
 * form quản lý tài khoản.
 *
 * Đây chỉ là cái chặn lỗi hiển nhiên ngay trên máy để người dùng khỏi mất một
 * vòng gọi mạng. Luật thật vẫn ở backend — nếu backend siết chặt hơn, thông
 * điệp của nó được hiện nguyên văn chứ không bị nuốt.
 */
export const MIN_PASSWORD_LENGTH = 6;

export const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`)
  .max(72, "Mật khẩu tối đa 72 ký tự.");

/*
 * Nguồn chân lý DUY NHẤT cho form tự đổi mật khẩu.
 *
 * Ô "nhập lại" chỉ tồn tại ở phía giao diện, không gửi lên: gõ sai một ký tự
 * trong mật khẩu mới rồi bấm lưu là tự khoá mình ra khỏi công cụ, và với tài
 * khoản sale thì phải nhờ admin đặt lại mới vào được.
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Nhập mật khẩu hiện tại."),
    new_password: passwordField,
    confirm_password: z.string().min(1, "Nhập lại mật khẩu mới."),
  })
  .refine((input) => input.new_password !== input.current_password, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    path: ["new_password"],
  })
  .refine((input) => input.new_password === input.confirm_password, {
    message: "Nhập lại không khớp với mật khẩu mới.",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const CHANGE_PASSWORD_DEFAULTS: ChangePasswordInput = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};
