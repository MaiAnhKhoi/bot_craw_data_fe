"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  MessageSquarePlusIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePlaceContact } from "@/features/places/hooks/use-place-contact";
import {
  CONTACT_STATUS_ORDER,
  contactStatusMeta,
} from "@/features/places/lib/contact";
import type { ContactStatus, Place } from "@/features/places/types/place";

/*
 * Ô "Chăm sóc": đổi trạng thái NGAY TẠI DÒNG + ghi chú của dòng đó.
 *
 * VÌ SAO ĐỔI NGAY TẠI DÒNG: sale vừa dập máy là đánh dấu, rồi sang dòng kế tiếp.
 * Bắt mở một trang chi tiết cho mỗi lead nghĩa là hai lần chuyển màn cho một cú
 * bấm — ở nhịp vài chục cuộc một buổi thì không ai làm, và không ai làm nghĩa là
 * dữ liệu chăm sóc rỗng, tức là lần quét sau lại gọi trùng.
 *
 * VÌ SAO GHI CHÚ NẰM TRONG POPOVER RIÊNG, KHÔNG NẰM TRONG MENU TRẠNG THÁI:
 * menu của Base UI bắt phím để điều hướng (mũi tên, gõ-để-nhảy, Esc). Nhét ô
 * nhập nhiều dòng vào đó là hai cơ chế bàn phím tranh nhau cùng một phím — gõ
 * chữ "c" nhảy sang mục khác, Enter đóng menu giữa câu. Tách ra là cách duy nhất
 * để cả hai cùng dùng được bằng bàn phím.
 *
 * VÌ SAO KHÔNG HIỆN THẲNG CHỮ GHI CHÚ TRONG BẢNG: bảng đang ảo hoá với chiều cao
 * dòng CỐ ĐỊNH (`ROW_HEIGHT` ở `places-table.tsx`) — thêm một dòng chữ nữa là
 * phép tính vị trí của trình ảo hoá sai ngay. Nên dấu hiệu "có ghi chú" đi bằng
 * HÌNH DẠNG icon (có gạch chữ / dấu cộng) cộng màu đậm-nhạt, còn nội dung nằm ở
 * `title` — rê chuột là đọc được, không phải mở ra.
 */

/*
 * Huy hiệu-nút. Dùng thẳng <button> mặc định của Menu.Trigger thay vì bọc
 * <Badge>: Badge vốn là <span>, muốn làm trigger phải khai thêm
 * `nativeButton={false}` rồi tự gánh lại ngữ nghĩa nút — đổi lấy đúng một cái
 * class chung thì không bõ.
 */
const HUY_HIEU =
  "inline-flex h-6 w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-4xl border border-transparent px-2 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

export function ContactCell({ place }: { place: Place }) {
  const chamSoc = usePlaceContact();
  const meta = contactStatusMeta(place.contact_status);
  const ghiChu = place.contact_note?.trim() ?? "";
  const coGhiChu = ghiChu.length > 0;

  const [moGhiChu, setMoGhiChu] = useState(false);
  /*
   * Đếm số lượt mở, dùng làm `key` của form. Mỗi lần mở là một lượt soạn mới nên
   * form phải nạp lại ghi chú HIỆN TẠI, không giữ đoạn gõ dở của lần trước.
   * Tăng ngay trong handler chứ không đồng bộ bằng useEffect — dự án cấm setState
   * trong effect, mà ở đây cũng không cần: sự kiện mở là chỗ duy nhất biết điều đó.
   */
  const [luotMo, setLuotMo] = useState(0);

  const doiMoGhiChu = (mo: boolean) => {
    setMoGhiChu(mo);
    if (mo) setLuotMo((truoc) => truoc + 1);
  };

  /*
   * Đổi trạng thái: KHÔNG gửi `note`, để backend giữ nguyên ghi chú đang có.
   * Gửi kèm "" ở đây là xoá sạch ghi chú mỗi lần đổi trạng thái.
   */
  const doiTrangThai = (giaTri: string) => {
    if (giaTri === place.contact_status) return;
    chamSoc.mutate({ id: place.id, status: giaTri as ContactStatus });
  };

  /*
   * Lưu ghi chú: gửi lại ĐÚNG trạng thái hiện tại để backend không nhích
   * `contact_at` — sửa một lỗi chính tả trong ghi chú không phải là một lần gọi
   * mới. Thất bại thì giữ popover mở: hook đã hoàn tác và báo bằng toast, đóng
   * nốt popover nữa là người dùng mất luôn đoạn vừa gõ.
   */
  const luuGhiChu = async (noiDung: string) => {
    try {
      await chamSoc.mutateAsync({
        id: place.id,
        status: place.contact_status,
        note: noiDung,
      });
      setMoGhiChu(false);
    } catch {
      /* Đã xử lý ở `onError` của hook. */
    }
  };

  const motaTrangThai = place.contact_at
    ? `${meta.label} — ${formatDateTime(place.contact_at)}`
    : meta.label;

  return (
    <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(HUY_HIEU, meta.badgeClass)}
          disabled={chamSoc.isPending}
          title={`${motaTrangThai}. Bấm để đổi.`}
          aria-label={`Trạng thái chăm sóc: ${meta.label}. Bấm để đổi.`}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
          {meta.label}
          <ChevronDownIcon className="size-3 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {/*
            * Menu.RadioGroup tự dựng context của Menu.Group nên GroupLabel đặt
            * thẳng trong đây là hợp lệ, không cần bọc thêm DropdownMenuGroup.
            *
            * `closeOnClick` phải khai tường minh: Base UI để mặc định `false` cho
            * RadioItem (hợp lý với menu nhiều lựa chọn), còn ở đây chọn xong là
            * xong — để menu dính lại thì mỗi dòng tốn thêm một cú bấm đóng.
            */}
          <DropdownMenuRadioGroup
            value={place.contact_status}
            onValueChange={doiTrangThai}
          >
            <DropdownMenuLabel>Trạng thái chăm sóc</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CONTACT_STATUS_ORDER.map((status) => {
              const muc = contactStatusMeta(status);
              return (
                <DropdownMenuRadioItem
                  key={status}
                  value={status}
                  closeOnClick
                  label={muc.label}
                >
                  <span
                    className={cn("size-1.5 rounded-full", muc.dotClass)}
                    aria-hidden="true"
                  />
                  {muc.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*
        * Nút ghi chú hiện ở MỌI dòng, kể cả dòng "Chưa liên hệ": "số sai, gọi lại
        * sau Tết" là ghi chú có trước cuộc gọi đầu tiên. Cho nút ẩn hiện theo
        * trạng thái còn làm ô nhảy chiều rộng mỗi lần đánh dấu, đúng lúc con trỏ
        * đang ở đó.
        */}
      <Popover open={moGhiChu} onOpenChange={doiMoGhiChu}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className={
                coGhiChu ? "text-foreground" : "text-muted-foreground/50"
              }
            />
          }
          title={coGhiChu ? `Ghi chú: ${ghiChu}` : "Thêm ghi chú"}
          aria-label={coGhiChu ? `Sửa ghi chú: ${ghiChu}` : "Thêm ghi chú"}
        >
          {coGhiChu ? <MessageSquareTextIcon /> : <MessageSquarePlusIcon />}
        </PopoverTrigger>
        {/*
          * `max-w-[calc(100vw-1.5rem)]`: ở 375px thì 18rem (w-72) vẫn vừa, nhưng
          * popover neo vào một nút nằm sát mép phải vùng cuộn ngang — chặn trần
          * để nó không đẩy ra ngoài màn hình rồi sinh thêm một thanh cuộn nữa.
          */}
        <PopoverContent align="end" className="max-w-[calc(100vw-1.5rem)]">
          <PopoverHeader>
            <PopoverTitle>Ghi chú chăm sóc</PopoverTitle>
            <PopoverDescription className="text-xs">
              {place.contact_at
                ? `${meta.label} · ${formatDateTime(place.contact_at)}`
                : "Chưa ghi nhận lần liên hệ nào."}
            </PopoverDescription>
          </PopoverHeader>
          <GhiChuForm
            key={luotMo}
            banDau={ghiChu}
            dangLuu={chamSoc.isPending}
            onLuu={luuGhiChu}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/*
 * Form soạn ghi chú. Tách thành component riêng để `key` ở trên remount được nó:
 * đó là cách nạp lại giá trị ban đầu mà không cần đồng bộ state trong useEffect.
 */
function GhiChuForm({
  banDau,
  dangLuu,
  onLuu,
}: {
  banDau: string;
  dangLuu: boolean;
  onLuu: (noiDung: string) => void;
}) {
  const [noiDung, setNoiDung] = useState(banDau);
  const daDoi = noiDung.trim() !== banDau;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onLuu(noiDung.trim());
      }}
    >
      <Textarea
        value={noiDung}
        onChange={(event) => setNoiDung(event.target.value)}
        placeholder="Đã gọi, hẹn gọi lại thứ 5..."
        /*
         * CHỈ đặt chiều cao. Cỡ chữ để nguyên `text-base md:text-sm` của
         * Textarea: đè `text-sm` xuống dưới 16px là Safari trên iPhone tự phóng
         * to cả trang ngay khi bấm vào ô — bảng đang cuộn ngang mà bị phóng nữa
         * thì người dùng mất luôn chỗ đang đứng.
         */
        className="min-h-20"
        aria-label="Nội dung ghi chú"
        autoFocus
        /*
         * Ctrl/Cmd + Enter để lưu. Enter trơn phải giữ nguyên nghĩa xuống dòng:
         * ghi chú bán hàng hay có nhiều ý ("gặp anh Hùng" / "cần báo giá CIF").
         */
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onLuu(noiDung.trim());
          }
        }}
      />
      <div className="flex items-center justify-end gap-2">
        {/*
          * "Xoá ghi chú" chỉ hiện khi đang có ghi chú THẬT trên server — gửi ""
          * cho một dòng vốn chưa có gì là một request không làm gì cả.
          */}
        {banDau ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mr-auto text-muted-foreground"
            disabled={dangLuu}
            onClick={() => onLuu("")}
          >
            Xoá ghi chú
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={dangLuu || !daDoi}>
          Lưu
        </Button>
      </div>
    </form>
  );
}
