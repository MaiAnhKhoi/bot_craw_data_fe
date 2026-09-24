import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * Logo công ty (agofruit) — dùng chung cho sidebar, header mobile, ngăn kéo
 * điều hướng và màn đăng nhập. Theo đúng cách ago_erp/ago_frontend xử lý logo
 * này (xem `components/layout/brand-mark.tsx` bên đó) để hai sản phẩm nội bộ
 * trông cùng một nhà.
 *
 * `dark` là BẮT BUỘC trên nền tối, không phải trang trí: logo là chữ XANH ĐẬM
 * (#336f08) viền trắng, đặt thẳng lên nền sidebar xanh đen thì phần viền xanh
 * chìm hẳn và chữ trông như bị gặm mất rìa. Quầng trắng 1px tách nó khỏi nền;
 * quầng ngoài để rộng nhưng rất nhạt, vì quầng đậm sẽ bệt thành mảng trắng đục
 * quanh logo.
 *
 * `unoptimized` vì bộ tối ưu ảnh của Next từ chối SVG trừ khi bật
 * `dangerouslyAllowSVG` — mà cờ đó cho phép MỌI SVG (kể cả nguồn ngoài) chạy
 * script trong thẻ <img>. Bỏ qua bộ tối ưu cho đúng một file nằm sẵn trong
 * `public/` thì an toàn hơn, và cũng chẳng mất gì: SVG không cần nén lại.
 *
 * `width`/`height` giữ nguyên kích thước gốc (630x225, tỉ lệ 2.8:1) để Next
 * chừa chỗ trước khi ảnh tải xong, tránh giật bố cục. Kích thước thật do `size`
 * quyết định, và LUÔN ràng theo CHIỀU CAO (`w-auto`): ràng theo chiều rộng sẽ
 * bóp méo chữ, còn bỏ `w-auto` thì next/image đặt sẵn cả hai chiều theo thuộc
 * tính width/height.
 */
export function Logo({
  className,
  dark = false,
  size = "md",
}: {
  className?: string;
  /** true khi đặt trên nền tối (sidebar, ngăn kéo mobile) */
  dark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Image
      src="/logo.svg"
      alt="agofruit"
      width={630}
      height={225}
      priority
      unoptimized
      className={cn(
        "w-auto",
        size === "lg" ? "h-11" : size === "sm" ? "h-6" : "h-7",
        dark &&
          "[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))_drop-shadow(0_1px_6px_rgba(255,255,255,0.3))]",
        className,
      )}
    />
  );
}

/*
 * Khối logo + tên công cụ, xếp DỌC.
 *
 * Bản đầu đặt logo nằm CẠNH chữ "Bot Craw Data / Thu thập lead Google Maps".
 * Sidebar rộng 240px, logo tỉ lệ 2.8:1 ăn hết 78px, phần chữ còn ~120px nên câu
 * mô tả vỡ thành ba dòng chen chúc trong một thanh cao 56px — nhìn rất rối.
 *
 * Xếp dọc và rút câu mô tả xuống một nhãn ngắn viết hoa giải quyết cả hai:
 * logo được nguyên bề ngang, chữ chỉ còn một dòng. Đây cũng là cách ago_erp làm
 * với nhãn "ERP NỘI BỘ".
 */
export function LogoBrand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Logo size="sm" dark={dark} />
      <span
        className={cn(
          "text-[9px] leading-none font-semibold tracking-[0.14em]",
          dark ? "text-sidebar-foreground/55" : "text-muted-foreground",
        )}
      >
        BOT CRAW DATA
      </span>
    </div>
  );
}
