"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RadarIcon } from "lucide-react";
import { NAV_ITEMS, isNavItemActive } from "@/components/layout/nav-items";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/*
 * Sidebar cố định của khung dashboard (từ breakpoint lg trở lên).
 * Dưới lg nó ẩn hẳn và điều hướng chuyển sang thanh ngang trong header —
 * công cụ này được mở cả trên điện thoại lúc đi gặp khách.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <Link
        href={ROUTES.dashboard}
        className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <RadarIcon className="size-4.5" />
        </span>
        <span className="font-heading text-sm leading-tight font-semibold">
          Bot Craw Data
          <span className="block text-xs font-normal text-sidebar-foreground/60">
            Thu thập lead Google Maps
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
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
    </aside>
  );
}
