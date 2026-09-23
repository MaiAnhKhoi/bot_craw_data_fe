import { z } from "zod";

/* Nguồn chân lý DUY NHẤT cho validation form đăng nhập (RHF + zodResolver). */
export const loginSchema = z.object({
  username: z.string().trim().min(1, "Nhập tên đăng nhập."),
  password: z.string().min(1, "Nhập mật khẩu."),
});

export type LoginInput = z.infer<typeof loginSchema>;
