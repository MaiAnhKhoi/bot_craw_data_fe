"use client";

import { useAuthStore } from "@/stores/auth-store";

/*
 * "Tôi có phải admin không?" — hỏi ở ĐÂY, đừng rải `user.role === "admin"` ra
 * khắp các màn. Một chỗ duy nhất nghĩa là khi vai trò thứ ba xuất hiện (hoặc
 * khi cách lưu vai trò đổi) thì chỉ có một file phải sửa.
 *
 * ẨN NÚT KHÔNG PHẢI LÀ BẢO MẬT. Hook này chỉ quyết định vẽ hay không vẽ; ai mở
 * F12 cũng gọi thẳng API được, và thứ chặn thật là 403 của backend trên mọi
 * endpoint ghi (/jobs, /keywords, chia nhỏ địa bàn, /users). Đừng bao giờ dùng
 * nó thay cho một phép kiểm tra phía server.
 *
 * Vai trò CHƯA BIẾT (`null` — phiên cũ lưu trước khi có phân quyền, `/auth/me`
 * chưa trả lời) được coi là KHÔNG phải admin: hiện thiếu một nút trong khoảng
 * hai trăm mili giây rồi nó xuất hiện thì nhẹ hơn hẳn việc cho bấm một nút mà
 * backend sẽ trả 403.
 */
export function useIsAdmin(): boolean {
  return useAuthStore((state) => state.role === "admin");
}
