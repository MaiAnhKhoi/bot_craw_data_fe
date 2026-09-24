"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRoundIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
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
import { ChangePasswordDialog } from "@/features/auth/components/auth/change-password-dialog";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { WorkerStatusBadge } from "@/features/stats/components/worker/worker-status-badge";
import { userRoleMeta } from "@/types/domain";

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
  /*
   * Hộp thoại đổi mật khẩu do header giữ trạng thái, không phải do một trigger
   * nằm trong menu: Base UI đóng menu ngay khi bấm vào mục, mà mục đó cũng là
   * cha của hộp thoại thì hộp thoại bị gỡ khỏi DOM trước khi kịp mở.
   */
  const [doiMatKhauOpen, setDoiMatKhauOpen] = useState(false);
  const vaiTro = userRoleMeta(user?.role);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 lg:px-6">
      <MobileNav />

      {/* Tên ứng dụng chỉ hiện dưới lg — từ lg trở lên nó đã có trên sidebar. */}
      <Link
        href={ROUTES.dashboard}
        className="flex min-w-0 items-center gap-2 lg:hidden"
      >
        <Logo size="sm" className="shrink-0" />
        <span className="truncate text-[9px] leading-none font-semibold tracking-[0.14em] text-muted-foreground">
          BOT CRAW DATA
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
            <DropdownMenuLabel className="text-sm text-foreground">
              <span className="block truncate">
                {user?.full_name || user?.username || "Đang tải..."}
              </span>
              {/*
               * Vai trò hiện ngay dưới tên vì nó trả lời câu hỏi sẽ được hỏi
               * nhiều nhất sau khi chia quyền: "sao máy tôi không có nút Tạo
               * job?". Thấy chữ "Sale" ở đây là hiểu ngay, khỏi phải đi hỏi.
               */}
              {vaiTro ? (
                <span className="block text-xs font-normal text-muted-foreground">
                  {vaiTro.label}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDoiMatKhauOpen(true)}>
              <KeyRoundIcon />
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        open={doiMatKhauOpen}
        onOpenChange={setDoiMatKhauOpen}
      />
    </header>
  );
}
