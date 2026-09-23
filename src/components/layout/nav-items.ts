import { BriefcaseIcon, LayoutDashboardIcon, MapPinnedIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants";

/*
 * Định nghĩa menu dùng chung cho sidebar (desktop) và thanh điều hướng gọn
 * (mobile) — khai một chỗ để hai nơi không bao giờ lệch nhau.
 * Đường dẫn lấy từ ROUTES, không gõ chuỗi path ở đây.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.dashboard, label: "Tổng quan", icon: LayoutDashboardIcon },
  { href: ROUTES.jobs, label: "Job quét", icon: BriefcaseIcon },
  { href: ROUTES.places, label: "Địa điểm", icon: MapPinnedIcon },
];

/*
 * Mục nào đang được chọn. `/` là trang gốc nên phải so khớp TUYỆT ĐỐI, nếu
 * dùng startsWith thì mọi route con đều làm "Tổng quan" sáng lên.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === ROUTES.dashboard) return pathname === ROUTES.dashboard;
  return pathname === href || pathname.startsWith(`${href}/`);
}
