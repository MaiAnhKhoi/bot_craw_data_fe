"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Nạp access token từ localStorage vào auth store đúng một lần sau khi app
 * mount phía client.
 *
 * Vì sao không đọc localStorage ngay lúc tạo store: HTML render ở server không
 * có token, nếu client khởi tạo với token thì React sẽ báo hydration mismatch.
 * Đọc trong effect là thời điểm an toàn duy nhất.
 *
 * Cờ `hydrated` bật lên sau lần đọc này; AuthGuard chờ cờ đó rồi mới quyết
 * định đẩy về /login, nên F5 không bị nháy qua màn đăng nhập.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
