import {
  BriefcaseIcon,
  LayoutDashboardIcon,
  MapPinOffIcon,
  MapPinnedIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { REMAINING_AREAS_ROUTE } from "@/features/remaining-areas/lib/remaining-areas";

/*
 * Định nghĩa menu dùng chung cho sidebar (desktop) và thanh điều hướng gọn
 * (mobile) — khai một chỗ để hai nơi không bao giờ lệch nhau.
 * Đường dẫn lấy từ ROUTES, không gõ chuỗi path ở đây; riêng Địa bàn còn sót giữ
 * đường dẫn trong chính feature của nó, vì ngoài menu này không nơi nào khác
 * dẫn tới đó.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  /**
   * Chỉ hiện với admin. ẨN MỤC MENU KHÔNG PHẢI LÀ BẢO MẬT — đây thuần tuý là
   * bớt thứ vô dụng trước mắt sale. Ai gõ thẳng đường dẫn vẫn vào được trang, và
   * thứ chặn thật là 403 của backend trên mọi endpoint bên dưới.
   */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.dashboard, label: "Tổng quan", icon: LayoutDashboardIcon },
  { href: ROUTES.jobs, label: "Job quét", icon: BriefcaseIcon },
  /*
   * Đứng ngay sau "Job quét" vì đó đúng là bước kế tiếp trong quy trình: quét
   * xong một lượt tỉnh thì việc tiếp theo là xem tỉnh nào Google cắt giữa chừng
   * mà chia nhỏ tiếp.
   */
  {
    href: REMAINING_AREAS_ROUTE,
    label: "Địa bàn còn sót",
    icon: MapPinOffIcon,
  },
  { href: ROUTES.places, label: "Địa điểm", icon: MapPinnedIcon },
  /*
   * Cuối danh sách vì nó nằm ngoài quy trình quét → chăm sóc lead: mỗi tháng mở
   * một lần, lúc có người vào hoặc nghỉ.
   */
  {
    href: ROUTES.users,
    label: "Quản lý tài khoản",
    icon: UsersIcon,
    adminOnly: true,
  },
];

/*
 * Mục menu hiện cho vai trò hiện tại. Sidebar và ngăn kéo mobile cùng gọi hàm
 * này — lọc riêng ở hai nơi là cách chắc chắn nhất để một hôm nào đó menu trên
 * điện thoại còn sót lại mục mà desktop đã bỏ.
 */
export function visibleNavItems(isAdmin: boolean): NavItem[] {
  return isAdmin ? NAV_ITEMS : NAV_ITEMS.filter((item) => !item.adminOnly);
}

/*
 * Mục nào đang được chọn. `/` là trang gốc nên phải so khớp TUYỆT ĐỐI, nếu
 * dùng startsWith thì mọi route con đều làm "Tổng quan" sáng lên.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === ROUTES.dashboard) return pathname === ROUTES.dashboard;
  return pathname === href || pathname.startsWith(`${href}/`);
}
