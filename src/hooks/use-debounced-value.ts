"use client";

import { useEffect, useState } from "react";

/*
 * Trả về giá trị đã trì hoãn `delay` mili giây kể từ lần đổi cuối.
 *
 * Dùng cho ô tìm kiếm của bảng Địa điểm: gõ 20 ký tự mà không debounce là 20
 * request tìm kiếm trên bảng vài trăm nghìn dòng. Timer được dọn ở cleanup nên
 * mỗi phím gõ thêm sẽ huỷ lượt chờ trước, không có request nào bị bắn lẻ.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
