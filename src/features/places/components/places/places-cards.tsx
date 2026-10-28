"use client";

import { GlobeIcon, PhoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/shared/copy-button";
import { formatNumber, shortenUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BUSINESS_STATUS_LABEL,
  WEBSITE_STATUS_META,
  livenessReasonLabels,
} from "@/features/places/lib/liveness";
import { ContactCell } from "@/features/places/components/places/contact-cell";
import { LivenessCell } from "@/features/places/components/places/liveness-cell";
import { PlaceActionsCell } from "@/features/places/components/places/place-actions-cell";
import type { Place, PlaceSort } from "@/features/places/types/place";

/*
 * Danh sách thẻ của màn Địa điểm — bản dành cho ĐIỆN THOẠI.
 *
 * Vì sao không thu nhỏ cái bảng: bảng có 11 cột, mỗi ô không xuống dòng. Ở 375px
 * chỉ thấy được cột tên rồi phải vuốt ngang bằng ngón tay để tìm số điện thoại,
 * mà số điện thoại và đánh dấu "đã gọi" mới là việc sale làm trên điện thoại.
 * Thẻ đặt đúng những thứ đó ra trước, không cần cuộn ngang.
 *
 * Thứ tự trong thẻ theo nhịp của một cuộc gọi: biết đây là ai và còn sống không
 * -> bấm gọi -> đánh dấu kết quả. Mọi ô thao tác dùng lại đúng component của
 * bảng (`ContactCell`, `LivenessCell`, `PlaceActionsCell`) với cờ `touch` để nút
 * to hơn, nên logic đổi trạng thái, ghi chú, kiểm tra lại chỉ có MỘT bản.
 *
 * Dữ liệu, bộ lọc, phân trang và xuất file không đổi: thẻ chỉ là cách vẽ khác
 * của cùng một trang kết quả do server trả về.
 */

const DASH = "—";

/*
 * Bảng không có tiêu đề cột để bấm sắp xếp thì thẻ cần một ô chọn riêng. Chỉ liệt
 * kê những khoá backend thật sự nhận (`PlaceSort`).
 */
const SORT_OPTIONS: { value: PlaceSort; label: string }[] = [
  { value: "-liveness", label: "Còn hoạt động trước" },
  { value: "name", label: "Tên A → Z" },
  { value: "-name", label: "Tên Z → A" },
  { value: "-rating", label: "Đánh giá cao nhất" },
  { value: "-review_count", label: "Nhiều đánh giá nhất" },
  { value: "-scraped_at", label: "Mới quét gần đây" },
];

function PlaceCard({ place }: { place: Place }) {
  const diaChi = place.address ?? place.address_short;
  const lyDo = livenessReasonLabels(place.liveness_reasons);
  const web = WEBSITE_STATUS_META[place.website_status];
  const soKhacNuoc =
    place.phone_country_code &&
    place.country_code &&
    place.phone_country_code !== place.country_code;

  const dongPhu = [
    place.category,
    place.country_name ?? place.country_code,
    place.rating === null
      ? null
      : `${place.rating.toFixed(1)}★ (${formatNumber(place.review_count)})`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="space-y-2.5 p-3">
      {/*
        * Tên chiếm cả bề ngang, huy hiệu tình trạng xuống dòng dưới. Để huy hiệu
        * đứng cạnh tên thì ở 375px tên bị ép còn ~60% bề ngang và xuống ba dòng.
        */}
      <div className="space-y-1">
        <p className="font-medium break-words">{place.name}</p>
        {place.business_status !== "OPERATIONAL" ? (
          <p className="text-xs text-destructive">
            {BUSINESS_STATUS_LABEL[place.business_status]}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <LivenessCell place={place} />
          <span className="text-xs text-muted-foreground">
            {dongPhu || DASH}
          </span>
        </div>
      </div>

      {/*
        * Lý do viết thẳng ra chứ không để trong tooltip như ở bảng: tooltip chỉ
        * hiện khi rê chuột, trên màn cảm ứng không có thao tác nào tương đương.
        * Mà lý do mới là thứ giúp sale quyết định có gọi hay không.
        */}
      {lyDo.length > 0 ? (
        <p className="text-xs text-muted-foreground">{lyDo.join(" · ")}</p>
      ) : null}

      {diaChi ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {diaChi}
          {/* Cùng lý do với bảng: mẩu địa chỉ rút gọn không được trông như địa chỉ thật. */}
          {!place.address ? (
            <span className="ms-1 text-xs text-amber-600 dark:text-amber-400">
              (chưa đầy đủ)
            </span>
          ) : null}
        </p>
      ) : null}

      {place.phone ? (
        <div className="flex items-center gap-2">
          {/*
            * Nút gọi là thao tác chính của thẻ nên là khối đặc, cao 44px — đúng cỡ
            * tối thiểu để chạm chắc bằng ngón tay. Số không hợp lệ vẫn gọi được
            * (có thể là máy lẻ) nhưng đổi sang màu hổ phách như ở bảng.
            */}
          <a
            href={`tel:${place.phone_e164 ?? place.phone}`}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-base font-semibold tabular-nums",
              place.phone_valid === false
                ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300"
                : "bg-primary text-primary-foreground",
            )}
          >
            <PhoneIcon className="size-4" />
            {place.phone}
          </a>
          <CopyButton
            value={place.phone_e164 ?? place.phone}
            label={`Sao chép số của ${place.name}`}
            className="size-11 [&_svg:not([class*='size-'])]:size-4"
          />
          {soKhacNuoc ? (
            <Badge
              variant="secondary"
              className="shrink-0 font-normal"
              title={`Số thuộc ${place.phone_country_code}, còn địa điểm ở ${place.country_name ?? place.country_code}`}
            >
              {place.phone_country_code}
            </Badge>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có số điện thoại</p>
      )}

      {place.website ? (
        <a
          href={place.website}
          target="_blank"
          rel="noreferrer noopener"
          className="flex min-h-9 items-center gap-2 text-sm text-primary hover:underline"
        >
          <GlobeIcon className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{shortenUrl(place.website)}</span>
          <Badge
            variant="secondary"
            className={cn("shrink-0", web.badgeClass)}
          >
            {web.label}
          </Badge>
        </a>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
        <ContactCell place={place} touch />
        <PlaceActionsCell place={place} touch />
      </div>
    </li>
  );
}

export function PlacesCards({
  places,
  sort,
  onSortChange,
}: {
  places: Place[];
  sort: PlaceSort;
  onSortChange: (sort: PlaceSort) => void;
}) {
  const hienTai = SORT_OPTIONS.find((option) => option.value === sort);

  return (
    <div>
      <label className="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm text-muted-foreground">
        Sắp xếp
        <Select
          value={sort}
          onValueChange={(value) => value && onSortChange(value as PlaceSort)}
        >
          <SelectTrigger className="w-52">
            <SelectValue>{() => hienTai?.label ?? "Tuỳ chỉnh"}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <ul className="divide-y">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </ul>
    </div>
  );
}

/* Skeleton cùng khung với thẻ thật để dữ liệu về không nhảy layout. */
export function PlacesCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="divide-y" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-10 w-full" />
        </li>
      ))}
    </ul>
  );
}
