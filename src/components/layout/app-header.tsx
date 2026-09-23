"use client";

import Link from "next/link";
import { LogOutIcon, RadarIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { WorkerStatusBadge } from "@/features/stats/components/worker/worker-status-badge";

/*
 * Header của khung dashboard.
 *
 * Dưới `lg` (sidebar đã ẩn): nút ba gạch mở ngăn kéo + tên ứng dụng.
 * Từ `lg` trở lên: sidebar lo phần điều hướng, header chỉ còn worker + tài khoản.
 *
 * Trước đây dưới `lg` header nhồi cả ba mục menu thành một hàng ngang. Ở bề
 * ngang 375px chúng chiếm gần hết chỗ, đẩy huy hiệu worker và nút tài khoản ra
 * sát mép và tạo thêm một vùng cuộn ngang thứ hai bên cạnh vùng cuộn của bảng.
 */
export function AppHeader() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 lg:px-6">
      <MobileNav />

      {/* Tên ứng dụng chỉ hiện dưới lg — từ lg trở lên nó đã có trên sidebar. */}
      <Link
        href={ROUTES.dashboard}
        className="flex min-w-0 items-center gap-2 lg:hidden"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <RadarIcon className="size-4" />
        </span>
        <span className="truncate font-heading text-sm font-semibold">
          Bot Craw Data
        </span>
      </Link>

      <div className="flex-1" />

      <WorkerStatusBadge />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tài khoản"
              className="shrink-0"
            />
          }
        >
          <UserIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/*
           * Bắt buộc bọc trong DropdownMenuGroup: DropdownMenuLabel là
           * <Menu.GroupLabel> của Base UI, nó đọc context của <Menu.Group>.
           * Thiếu Group thì bấm vào nút tài khoản là sập trang (Base UI error #31).
           */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate text-sm text-foreground">
              {user?.full_name || user?.username || "Đang tải..."}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
