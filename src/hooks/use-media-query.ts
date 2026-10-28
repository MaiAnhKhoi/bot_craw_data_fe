"use client";

import { useSyncExternalStore } from "react";

/*
 * Theo dõi một media query, trả về true khi đang khớp.
 *
 * Dùng cho chỗ phải dựng HAI cấu trúc khác nhau theo cỡ màn hình (bảng trên máy
 * tính, thẻ trên điện thoại). Ẩn một bên bằng CSS thì cả hai cùng nằm trong DOM —
 * với 200 dòng, mỗi dòng có menu và popover, là gấp đôi công dựng không ai nhìn.
 *
 * `serverValue` là giá trị khi chưa có `window`. Màn dùng nó chỉ dựng SAU khi
 * AuthGuard xác nhận phiên (lần render đầu lúc hydrate vẫn là skeleton), nên giá
 * trị này không bao giờ lệch với lần render đầu ở client.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
