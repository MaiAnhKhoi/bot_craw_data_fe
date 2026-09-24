"use client";

import { useState } from "react";
import { LogoBrand } from "@/components/layout/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isNavItemActive, visibleNavItems } from "@/components/layout/nav-items";
import { useIsAdmin } from "@/features/auth/hooks/use-is-admin";
import { cn } from "@/lib/utils";

/*
 * Điều hướng trên màn hình nhỏ: ngăn kéo trượt từ trái, mở bằng nút ba gạch.
 *
 * Trước đây các mục menu được xếp thành một hàng ngang ngay trong header. Trên
 * điện thoại nó hỏng theo hai cách cùng lúc: ba mục chiếm gần hết bề ngang nên
 * huy hiệu worker và nút tài khoản bị ép vào mép, và khi thêm mục thứ tư thì
 * hàng đó phải cuộn ngang — một vùng cuộn ngang nằm ngay cạnh vùng cuộn ngang
 * của bảng dữ liệu, gần như không ai bấm trúng.
 *
 * Ngăn kéo giải quyết cả hai: header chỉ còn một nút 36px, và menu có đủ chỗ để
 * mỗi mục là một vùng bấm cao 44px (ngưỡng tối thiểu cho ngón tay).
 */
export function MobileNav() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const items = visibleNavItems(isAdmin);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mở menu điều hướng"
            className="shrink-0 lg:hidden"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-72 gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs"
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <LogoBrand dark />
          {/*
            * Radix/Base UI bắt Sheet phải có tiêu đề để trình đọc màn hình đọc
            * được ngăn kéo này. Tên công cụ đã nằm trong `LogoBrand` dưới dạng
            * chữ trang trí nên tiêu đề thật ẩn đi, tránh hiện hai lần.
            */}
          <SheetTitle className="sr-only">Bot Craw Data</SheetTitle>
        </div>
        <SheetDescription className="sr-only">
          Chuyển giữa các màn hình của công cụ.
        </SheetDescription>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                /*
                 * Đóng ngay tại chỗ bấm, KHÔNG dùng effect theo dõi pathname:
                 * thiếu bước này thì trang đã đổi nhưng ngăn kéo vẫn che kín
                 * màn hình. (Effect cũng bị `react-hooks/set-state-in-effect`
                 * chặn, và đúng là không cần — điều hướng bắt đầu từ cú bấm này.)
                 */
                onClick={() => setOpen(false)}
                className={cn(
                  // min-h-11 = 44px: ngưỡng vùng chạm tối thiểu trên điện thoại.
                  "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/50">
          Công cụ nội bộ — dùng đúng mục đích.
        </p>
      </SheetContent>
    </Sheet>
  );
}
