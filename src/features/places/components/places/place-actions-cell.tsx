"use client";

import { MapPinIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReverifyPlace } from "@/features/places/hooks/use-reverify-place";
import type { Place } from "@/features/places/types/place";

/*
 * Cụm hành động trên mỗi dòng: mở Google Maps và "Kiểm tra lại".
 *
 * Link Maps mở tab mới kèm rel="noreferrer" — trang đích là bên thứ ba, không
 * có lý do gì trao cho nó `window.opener`.
 */
export function PlaceActionsCell({ place }: { place: Place }) {
  const reverify = useReverifyPlace();
  const pending = reverify.isPending && reverify.variables === place.id;

  return (
    <div className="flex items-center justify-end gap-1">
      {place.maps_url ? (
        <Button
          variant="ghost"
          size="icon-sm"
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
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => reverify.mutate(place.id)}
      >
        <RefreshCwIcon
          className={pending ? "animate-spin motion-reduce:animate-none" : undefined}
        />
        Kiểm tra lại
      </Button>
    </div>
  );
}
