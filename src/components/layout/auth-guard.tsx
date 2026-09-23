"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Cổng chặn của khung dashboard.
 *
 * Guard phải xử đúng BA trạng thái, không phải hai:
 *   đang nạp token từ localStorage → skeleton
 *   có token                        → nội dung
 *   không có token                  → đẩy về /login
 * Bỏ trạng thái đầu thì mỗi lần F5 màn sẽ nháy qua /login rồi mới quay lại.
 *
 * Chỉ đọc đúng hai trường của store (`useStore(s => s.field)`) để không
 * re-render cả khung mỗi khi một phần khác của store đổi.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(ROUTES.login);
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-dvh flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
