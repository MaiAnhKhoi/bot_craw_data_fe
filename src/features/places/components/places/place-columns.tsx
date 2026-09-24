"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { formatNumber, shortenUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BUSINESS_STATUS_LABEL,
  WEBSITE_STATUS_META,
} from "@/features/places/lib/liveness";
import { ContactCell } from "@/features/places/components/places/contact-cell";
import { LivenessCell } from "@/features/places/components/places/liveness-cell";
import { PlaceActionsCell } from "@/features/places/components/places/place-actions-cell";
import type { Place } from "@/features/places/types/place";

/*
 * Định nghĩa cột của bảng Địa điểm (TanStack Table v8).
 *
 * `id` của cột nào sắp xếp được thì TRÙNG với khoá `sort` của backend
 * (docs/API_CONTRACT.md §3) — nhờ vậy bảng chỉ việc gửi thẳng id lên server,
 * không cần thêm một bảng ánh xạ dễ lệch.
 *
 * Bốn cột đầu là 4 trường bắt buộc theo yêu cầu nghiệp vụ: tên công ty, vị trí,
 * số điện thoại, website.
 */

/** Cột sắp xếp được ở SERVER. Cột không có trong đây thì không hiện nút sắp xếp. */
export const SORTABLE_COLUMN_IDS = new Set([
  "name",
  "liveness",
  "rating",
  "review_count",
]);

/** Nhãn tiếng Việt của từng cột — dùng cho menu ẩn/hiện cột và skeleton. */
export const PLACE_COLUMN_LABELS: Record<string, string> = {
  name: "Tên công ty",
  address: "Vị trí",
  country: "Quốc gia",
  phone: "SĐT",
  website: "Website",
  liveness: "Tình trạng",
  contact: "Chăm sóc",
  category: "Danh mục",
  rating: "Đánh giá",
  review_count: "Lượt đánh giá",
  actions: "Hành động",
};

const DASH = "—";

/*
 * Nhãn cho NGUỒN xác định quốc gia. Mục đích là biến một phỏng đoán vô hình
 * thành phỏng đoán nhìn thấy được: "gl" nghĩa là hệ thống chỉ đoán theo nước
 * đang tìm, không có bằng chứng nào từ chính địa điểm đó.
 */
const NGUON_QUOC_GIA: Record<string, { nhan: string; canh_bao: boolean }> = {
  address: { nhan: "đọc từ địa chỉ", canh_bao: false },
  coords: { nhan: "suy từ toạ độ", canh_bao: false },
  gl: { nhan: "đoán theo nước đang tìm — nên kiểm lại", canh_bao: true },
};

export const placeColumns: ColumnDef<Place>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: PLACE_COLUMN_LABELS.name,
    cell: ({ row }) => {
      const place = row.original;
      return (
        <div className="max-w-64">
          <p className="truncate font-medium">{place.name}</p>
          {place.business_status !== "OPERATIONAL" ? (
            <p className="truncate text-xs text-destructive">
              {BUSINESS_STATUS_LABEL[place.business_status]}
            </p>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "address",
    accessorKey: "address",
    header: PLACE_COLUMN_LABELS.address,
    cell: ({ row }) => {
      const place = row.original;
      /*
       * Ba trạng thái KHÁC NHAU, và phải hiện khác nhau — gộp lại chính là gốc
       * của chuyện "ô địa chỉ lúc rỗng lúc hiện không đầy đủ":
       *   1. có địa chỉ đầy đủ  -> hiện bình thường
       *   2. chỉ có mẩu từ thẻ  -> hiện mẩu đó, NHƯNG nói rõ là chưa đầy đủ
       *   3. chưa có gì         -> gạch ngang
       * Đo thật trên 2.526 dòng chưa mở trang chi tiết: 39% rơi vào ca 3, phần
       * còn lại là ca 2 với độ dài trung bình 20 ký tự ("Phan Huy Ích").
       */
      const dayDu = place.address;
      const hienThi = dayDu ?? place.address_short;
      if (!hienThi) {
        return <span className="text-muted-foreground">{DASH}</span>;
      }
      /*
       * `line-clamp-2` chứ không `truncate`: địa chỉ đầy đủ của Google dài hơn
       * hẳn một dòng, cắt một dòng thì mất sạch phần đuôi — mà đuôi mới là chỗ
       * ghi tỉnh/thành và quốc gia. `title` giữ phần còn thừa, nút copy để khỏi
       * phải bôi đen thủ công.
       *
       * Hai điều kiện BẮT BUỘC để line-clamp thật sự chạy ở đây, thiếu một cái
       * là nó âm thầm quay về cắt đúng một dòng:
       *  1. `whitespace-normal` — TableCell đặt sẵn `whitespace-nowrap`, chữ
       *     không xuống dòng được thì kẹp mấy dòng cũng vô nghĩa.
       *  2. Thẻ bị kẹp KHÔNG được là flex item. line-clamp hoạt động bằng
       *     `display:-webkit-box`, mà flex item thì bị blockify thành
       *     `flow-root` — thuộc tính vẫn nằm đó nhưng không còn tác dụng. Nên
       *     dùng khối thường + nút copy đặt tuyệt đối, không dùng flex.
       */
      return (
        // `w-80` chứ không `max-w-80`: khi chữ đã xuống dòng được, bảng
        // table-auto sẽ co cột này về bề rộng NHỎ NHẤT có thể (min-content)
        // và ta được hai dòng cụt còn ngắn hơn lúc cắt một dòng.
        <div className="relative w-80 pe-6">
          <span
            className="line-clamp-2 whitespace-normal text-muted-foreground"
            title={
              dayDu
                ? dayDu
                : `${hienThi} — địa chỉ rút gọn từ thẻ kết quả, chưa đầy đủ. Mở trang chi tiết (chạy lại job với "Chỉ khi thiếu dữ liệu") để lấy địa chỉ đầy đủ.`
            }
          >
            {hienThi}
            {/*
              * Nhãn này BẮT BUỘC phải có. Không có nó thì "Phan Huy Ích" trông
              * y hệt một địa chỉ thật, và người dùng gửi thư tới đó.
              */}
            {!dayDu ? (
              <span className="ms-1 text-xs whitespace-nowrap text-amber-600 dark:text-amber-400">
                (chưa đầy đủ)
              </span>
            ) : null}
          </span>
          <CopyButton
            value={hienThi}
            label={`Sao chép địa chỉ của ${place.name}`}
            className="absolute end-0 top-0"
          />
        </div>
      );
    },
  },
  {
    id: "country",
    accessorKey: "country_code",
    header: PLACE_COLUMN_LABELS.country,
    cell: ({ row }) => {
      const place = row.original;
      if (!place.country_code) {
        return <span className="text-muted-foreground">{DASH}</span>;
      }
      /*
       * Mã + tên chứ KHÔNG dùng emoji cờ: cờ quốc gia là cặp ký tự Regional
       * Indicator, Windows không có glyph nên Chrome trên Windows hiện ra hai
       * chữ cái trong ô vuông — xấu và không đồng nhất giữa các máy.
       */
      const nguon = place.country_source
        ? NGUON_QUOC_GIA[place.country_source]
        : undefined;
      return (
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
          title={nguon ? `Quốc gia ${nguon.nhan}` : undefined}
        >
          <span className="rounded border px-1 py-px text-[10px] font-medium text-muted-foreground">
            {place.country_code}
          </span>
          <span>{place.country_name ?? place.country_code}</span>
          {/* Chỉ đánh dấu ca YẾU. Đánh dấu cả ba nguồn thì dấu hiệu mất giá trị. */}
          {nguon?.canh_bao ? (
            <span
              aria-label="Quốc gia chỉ là phỏng đoán"
              className="size-1.5 shrink-0 rounded-full bg-amber-500"
            />
          ) : null}
        </span>
      );
    },
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: PLACE_COLUMN_LABELS.phone,
    cell: ({ row }) => {
      const place = row.original;
      if (!place.phone) {
        return <span className="text-muted-foreground">{DASH}</span>;
      }
      return (
        <span className="inline-flex items-center gap-1">
          <a
            href={`tel:${place.phone_e164 ?? place.phone}`}
            className={cn(
              "tabular-nums hover:underline",
              place.phone_valid === false && "text-amber-600 dark:text-amber-400",
            )}
          >
            {place.phone}
          </a>
          <CopyButton
            value={place.phone_e164 ?? place.phone}
            label={`Sao chép số của ${place.name}`}
          />
          {/*
           * Số thuộc nước KHÁC với nước của địa điểm. KHÔNG phải lỗi: doanh
           * nghiệp Thái niêm yết số Việt Nam thường là đầu mối có người Việt
           * phụ trách — đáng chú ý theo hướng TỐT. Nên dùng màu trung tính,
           * đừng dùng màu cảnh báo.
           */}
          {place.phone_country_code &&
          place.country_code &&
          place.phone_country_code !== place.country_code ? (
            <Badge
              variant="secondary"
              className="shrink-0 font-normal"
              title={`Số thuộc ${place.phone_country_code}, còn địa điểm ở ${place.country_name ?? place.country_code}`}
            >
              {place.phone_country_code}
            </Badge>
          ) : null}
        </span>
      );
    },
  },
  {
    id: "website",
    accessorKey: "website",
    header: PLACE_COLUMN_LABELS.website,
    cell: ({ row }) => {
      const place = row.original;
      const status = WEBSITE_STATUS_META[place.website_status];
      if (!place.website) {
        return (
          <Badge variant="secondary" className={status.badgeClass}>
            {status.label}
          </Badge>
        );
      }
      return (
        <span className="inline-flex max-w-56 items-center gap-1.5">
          <a
            href={place.website}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate hover:underline"
          >
            {shortenUrl(place.website)}
          </a>
          <Badge
            variant="secondary"
            className={cn("shrink-0", status.badgeClass)}
          >
            {status.label}
          </Badge>
        </span>
      );
    },
  },
  {
    id: "liveness",
    accessorKey: "liveness_score",
    header: PLACE_COLUMN_LABELS.liveness,
    cell: ({ row }) => <LivenessCell place={row.original} />,
  },
  {
    /*
     * Đặt ngay sau "Tình trạng" để hai cột trạng thái đứng cạnh nhau, và để bốn
     * cột đầu vẫn nguyên là bốn trường bắt buộc theo yêu cầu nghiệp vụ.
     *
     * KHÔNG nằm trong `SORTABLE_COLUMN_IDS`: backend không có khoá sort cho
     * `contact_status`. Muốn xem riêng nhóm nào thì dùng ô lọc "Mọi trạng thái
     * chăm sóc" — nó lọc trên TOÀN BỘ tập dữ liệu chứ không chỉ trang đang xem.
     */
    id: "contact",
    accessorKey: "contact_status",
    header: PLACE_COLUMN_LABELS.contact,
    cell: ({ row }) => <ContactCell place={row.original} />,
  },
  {
    id: "category",
    accessorKey: "category",
    header: PLACE_COLUMN_LABELS.category,
    /*
     * CHỈ hiện tên ngành nghề, không đánh dấu gì.
     *
     * Bộ lọc ngành nghề là hạ tầng NGẦM: nó vẫn chạy lúc quét, nhưng người dùng
     * chỉ gõ từ khoá rồi nhận về dữ liệu sạch, không phải học thêm khái niệm
     * nào. Các trường `relevance*` vẫn về trong payload và vẫn nằm trong type
     * để truy vết khi chất lượng dữ liệu có vấn đề — chỉ giao diện là im lặng.
     */
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.category ?? DASH}
      </span>
    ),
  },
  {
    id: "rating",
    accessorKey: "rating",
    header: PLACE_COLUMN_LABELS.rating,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.rating === null ? DASH : row.original.rating.toFixed(1)}
      </span>
    ),
  },
  {
    id: "review_count",
    accessorKey: "review_count",
    header: PLACE_COLUMN_LABELS.review_count,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatNumber(row.original.review_count)}
      </span>
    ),
  },
  {
    id: "actions",
    header: PLACE_COLUMN_LABELS.actions,
    enableHiding: false,
    cell: ({ row }) => <PlaceActionsCell place={row.original} />,
  },
];
