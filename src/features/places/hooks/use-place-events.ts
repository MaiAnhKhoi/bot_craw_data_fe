"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { placeEventsUrl } from "@/features/places/api/places-api";
import { placeKeys } from "@/features/places/hooks/use-places";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Bảng Địa điểm tự cập nhật theo thời gian thực.
 *
 * Backend giữ một kết nối SSE và CHỈ bắn tin khi dữ liệu thật sự đổi
 * (docs/API_CONTRACT.md §3). Hook này nhận tin rồi cho TanStack Query nạp lại —
 * cố ý KHÔNG tự vá dữ liệu vào cache như `useJobEvents` làm: gói tin ở đây chỉ
 * có mấy con số tổng, không chứa dòng nào, mà bảng còn đang lọc/sắp/phân trang
 * nên chỉ server mới biết trang hiện tại phải gồm những dòng nào.
 *
 * Gói ĐẦU TIÊN bị bỏ qua có chủ ý: nó là ảnh chụp lúc vừa kết nối, mà dữ liệu
 * đó vừa được `usePlaces` tải xong ngay trước đó. Nạp lại ngay là một request
 * thừa mỗi lần mở trang, và mỗi lần kết nối rớt rồi nối lại cũng thêm một cái.
 *
 * Vòng đời giống `useJobEvents`: mất kết nối thì thử lại với backoff luỹ thừa
 * (tối đa 30 giây), unmount thì huỷ timer và đóng kết nối để không rò.
 */

const MAX_RETRY_DELAY_MS = 30_000;

export interface PlaceEventsState {
  /** Kết nối SSE đang mở — dùng để hiện chỉ báo "đang theo dõi". */
  connected: boolean;
}

export function usePlaceEvents(): PlaceEventsState {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [connected, setConnected] = useState(false);
  /*
   * Ref chứ không state: cờ này chỉ điều khiển nhánh xử lý bên trong effect,
   * đưa vào state sẽ kéo theo một lượt render thừa cho mỗi gói tin nhận được.
   */
  const boQuaGoiDau = useRef(true);

  useEffect(() => {
    if (!token) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let attempt = 0;

    const closeSource = () => {
      source?.close();
      source = null;
    };

    const connect = () => {
      if (stopped) return;
      const eventSource = new EventSource(placeEventsUrl(token));
      source = eventSource;

      eventSource.addEventListener("open", () => {
        attempt = 0;
        /*
         * CỐ Ý không đặt lại `boQuaGoiDau` ở đây — chỉ lần kết nối ĐẦU TIÊN mới
         * được bỏ qua ảnh chụp. Lần nối lại sau khi rớt mạng thì phải nạp lại:
         * dữ liệu hoàn toàn có thể đã đổi trong lúc đứt, mà backend chỉ bắn tin
         * khi có THAY ĐỔI MỚI — bỏ qua ảnh chụp đó là bảng đứng im cho tới lần
         * thay đổi kế tiếp, có khi là mãi mãi nếu job vừa chạy xong.
         */
        setConnected(true);
      });

      eventSource.addEventListener("places", () => {
        if (boQuaGoiDau.current) {
          boQuaGoiDau.current = false;
          return;
        }
        /*
         * Nạp lại CẢ nhóm `places`: danh sách hiện tại và cả danh mục quốc gia
         * của ô lọc — quét ra một nước mới thì ô lọc cũng phải có thêm mục đó.
         */
        queryClient.invalidateQueries({ queryKey: placeKeys.all });
      });

      eventSource.onerror = () => {
        closeSource();
        setConnected(false);
        if (stopped) return;
        attempt += 1;
        const delay = Math.min(
          MAX_RETRY_DELAY_MS,
          1_000 * 2 ** Math.min(attempt - 1, 5),
        );
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      closeSource();
      setConnected(false);
    };
  }, [token, queryClient]);

  return { connected };
}
