"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setPlaceContact } from "@/features/places/api/places-api";
import { placeKeys } from "@/features/places/hooks/use-places";
import { errorMessage } from "@/lib/api";
import type { Page } from "@/types/common";
import type { ContactStatus, Place } from "@/features/places/types/place";

/*
 * Ghi trạng thái chăm sóc / ghi chú cho một lead, CẬP NHẬT LẠC QUAN.
 *
 * Vì sao không `invalidateQueries`: sale ngồi đánh dấu hàng chục dòng liên tiếp.
 * Mỗi lần invalidate là một câu truy vấn danh sách đầy đủ (lọc + sắp + đếm phân
 * trang) trên bảng có thể hàng trăm nghìn dòng, rồi cả bảng mờ đi và vẽ lại —
 * ở nhịp đó thì công cụ không dùng được. Ở đây ta vá đúng MỘT dòng vào cache
 * bằng `setQueriesData`, huy hiệu đổi màu ngay trong cùng khung hình.
 *
 * CỐ Ý KHÔNG `cancelQueries` như công thức mẫu của TanStack. Bảng này dùng
 * `keepPreviousData`, huỷ một lượt tải đang bay không làm nó tự tải lại — người
 * dùng vừa sang trang mới mà lượt tải bị huỷ là bảng đứng ở dữ liệu trang cũ
 * cho tới khi có thao tác khác. Đổi lại, có một cửa sổ rất hẹp: lượt tải bắt đầu
 * TRƯỚC khi bấm mà về SAU sẽ đè lại dữ liệu cũ; `onSuccess` vá lần nữa bằng bản
 * ghi server trả về nên trạng thái cuối cùng vẫn đúng.
 */

export interface PlaceContactInput {
  id: number;
  status: ContactStatus;
  /** Bỏ trống/null = giữ nguyên ghi chú; "" = xoá; chuỗi khác = ghi đè. */
  note?: string | null;
}

/** Ảnh chụp cache trước khi vá, để hoàn tác khi PATCH hỏng. */
interface AnhChup {
  trangCu: [readonly unknown[], Page<Place> | undefined][];
}

/*
 * Vá một dòng vào MỌI trang danh sách đang nằm trong cache.
 *
 * Quét theo tiền tố `["places","list"]` chứ không theo key hiện tại: người dùng
 * có thể đã xem vài bộ lọc/vài trang trong cùng phiên, cùng một địa điểm có mặt
 * ở nhiều bản cache — vá thiếu chỗ nào thì quay lại bộ lọc đó sẽ thấy trạng thái
 * cũ hiện về như thể thao tác không ăn.
 *
 * Trang nào không chứa dòng này thì trả về ĐÚNG object cũ, TanStack so sánh tham
 * chiếu nên không component nào render lại vô ích.
 */
function vaVaoCache(
  queryClient: QueryClient,
  id: number,
  doi: (place: Place) => Place,
): void {
  queryClient.setQueriesData<Page<Place>>(
    { queryKey: placeKeys.lists() },
    (trang) => {
      if (!trang) return trang;
      const viTri = trang.items.findIndex((item) => item.id === id);
      if (viTri < 0) return trang;
      const items = trang.items.slice();
      items[viTri] = doi(items[viTri]);
      return { ...trang, items };
    },
  );
}

/*
 * Ghi chú sau khi vá, theo đúng ba nghĩa của `note` trong contract.
 * Backend trả về `null` cho ghi chú rỗng, nên "" cũng quy về `null` để bản vá
 * lạc quan giống hệt bản server sẽ trả — không có chuyện nháy một cái khi
 * `onSuccess` ghi đè.
 */
function ghiChuMoi(hienTai: string | null, note: string | null | undefined) {
  if (note === undefined || note === null) return hienTai;
  return note === "" ? null : note;
}

export function usePlaceContact() {
  const queryClient = useQueryClient();

  return useMutation<Place, unknown, PlaceContactInput, AnhChup>({
    mutationFn: ({ id, status, note }) => setPlaceContact(id, { status, note }),

    onMutate: (bien) => {
      const trangCu = queryClient.getQueriesData<Page<Place>>({
        queryKey: placeKeys.lists(),
      });

      vaVaoCache(queryClient, bien.id, (place) => ({
        ...place,
        contact_status: bien.status,
        contact_note: ghiChuMoi(place.contact_note, bien.note),
        /*
         * Bắt chước đúng quy tắc của backend: `contact_at` CHỈ nhích khi trạng
         * thái đổi. Đoán sai ở đây thì dòng "Đã gọi lúc..." nhảy ngày mỗi lần
         * sửa chính tả trong ghi chú, rồi `onSuccess` kéo ngược lại — nháy một
         * cái ngay trước mắt người dùng.
         */
        contact_at:
          place.contact_status === bien.status
            ? place.contact_at
            : new Date().toISOString(),
      }));

      return { trangCu };
    },

    /*
     * Server trả về bản ghi ĐẦY ĐỦ đã cập nhật — ghi đè bản đoán bằng sự thật.
     * Không invalidate: dòng này đã đúng, phần còn lại của bảng không đổi.
     *
     * Dòng có thể không còn khớp bộ lọc đang bật (đang lọc "Chưa liên hệ" mà vừa
     * đánh dấu "Đã gọi"). CỐ Ý để nó nằm lại cho tới lần tải kế tiếp: dòng biến
     * mất ngay dưới con trỏ là cách nhanh nhất khiến người dùng mất dấu chỗ đang
     * làm và đánh dấu nhầm dòng bên dưới.
     */
    onSuccess: (place) => {
      vaVaoCache(queryClient, place.id, () => place);
    },

    onError: (error, _bien, context) => {
      for (const [key, trang] of context?.trangCu ?? []) {
        queryClient.setQueryData(key, trang);
      }
      toast.error(
        errorMessage(error, "Không lưu được trạng thái chăm sóc, đã hoàn tác."),
      );
    },
  });
}
