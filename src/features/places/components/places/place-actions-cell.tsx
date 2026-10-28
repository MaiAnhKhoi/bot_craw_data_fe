"use client";

import { MapPinIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReverifyPlace } from "@/features/places/hooks/use-reverify-place";
import { cn } from "@/lib/utils";
import type { Place } from "@/features/places/types/place";

/*
 * Cụm hành động trên mỗi dòng: mở Google Maps và "Kiểm tra lại".
 *
 * Link Maps mở tab mới kèm rel="noreferrer" — trang đích là bên thứ ba, không
 * có lý do gì trao cho nó `window.opener`.
 *
 * `touch` là bản cho thẻ ở điện thoại: hai nút biểu tượng 40px thay cho nút 28px
 * và nút có chữ của bảng — bấm bằng chuột thì được, bằng ngón tay thì trượt. Chỉ
 * còn biểu tượng để cả hai nằm chung hàng với ô chăm sóc (thẻ đỡ cao một hàng);
 * tên nút vẫn có ở `aria-label` cho trình đọc màn hình.
 */
export function PlaceActionsCell({
  place,
  touch = false,
}: {
  place: Place;
  touch?: boolean;
}) {
  const reverify = useReverifyPlace();
  const pending = reverify.isPending && reverify.variables === place.id;

  return (
    <div
      className={cn(
        "flex items-center",
        touch ? "gap-2" : "justify-end gap-1",
      )}
    >
      {place.maps_url ? (
        <Button
          variant={touch ? "outline" : "ghost"}
          size={touch ? "icon-lg" : "icon-sm"}
          className={touch ? "size-10" : undefined}
          aria-label="Mở trên Google Maps"
          title="Mở trên Google Maps"
          /*
           * `nativeButton={false}` là BẮT BUỘC khi render thành thẻ không phải
           * <button>. Base UI mặc định `nativeButton: true`; để nguyên thì nó cảnh
           * báo ngay ở console và — quan trọng hơn — nó vẫn gắn ngữ nghĩa/thuộc
           * tính của <button> lên thẻ <a>, làm hỏng trợ năng và hành vi trong form.
           */
          nativeButton={false}
          render={
            <a href={place.maps_url} target="_blank" rel="noreferrer noopener" />
          }
        >
          <MapPinIcon />
        </Button>
      ) : null}

      <Button
        variant={touch ? "outline" : "ghost"}
        size={touch ? "icon-lg" : "sm"}
        className={touch ? "size-10" : undefined}
        aria-label="Kiểm tra lại"
        title="Kiểm tra lại"
        disabled={pending}
        onClick={() => reverify.mutate(place.id)}
      >
        <RefreshCwIcon
          className={pending ? "animate-spin motion-reduce:animate-none" : undefined}
        />
        {touch ? null : "Kiểm tra lại"}
      </Button>
    </div>
  );
}
