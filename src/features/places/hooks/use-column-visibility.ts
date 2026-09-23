"use client";

import { useCallback, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { PLACES_COLUMNS_STORAGE_KEY } from "@/lib/constants";

/*
 * Ghi nhớ cột đang ẩn/hiện của bảng Địa điểm vào localStorage.
 *
 * Đây là sở thích RIÊNG của từng người trên từng máy, không phải dữ liệu server
 * — localStorage là đúng chỗ. Mọi truy cập bọc try/catch vì ở chế độ ẩn danh
 * hoặc khi site-data bị chặn, chỉ ĐỌC thôi đã ném lỗi.
 *
 * Đọc ngay trong initializer của useState (chạy đúng một lần) thay vì trong
 * effect: nhánh effect tạo thêm một vòng render và bị quy tắc
 * `react-hooks/set-state-in-effect` chặn. An toàn với hydration vì màn Địa điểm
 * chỉ được dựng SAU khi AuthGuard xác nhận có phiên — lần render đầu (lúc
 * hydrate) cả server lẫn client đều đang hiện skeleton của guard, nên không có
 * gì để lệch.
 */

function readStoredVisibility(): VisibilityState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PLACES_COLUMNS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  } catch {
    return {};
  }
}

export function useColumnVisibility() {
  const [visibility, setVisibility] = useState<VisibilityState>(
    readStoredVisibility,
  );

  const update = useCallback((next: VisibilityState) => {
    setVisibility(next);
    try {
      window.localStorage.setItem(
        PLACES_COLUMNS_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Không ghi được thì lựa chọn chỉ sống trong phiên này.
    }
  }, []);

  return [visibility, update] as const;
}
