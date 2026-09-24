"use client";

import { useState } from "react";
import { ShieldAlertIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { CreateUserDialog } from "@/features/users/components/users/create-user-dialog";
import {
  USER_TABLE_COLUMNS,
  UsersTable,
} from "@/features/users/components/users/users-table";
import { useUsers } from "@/features/users/hooks/use-users";

/*
 * Màn Quản lý tài khoản — chỉ admin.
 *
 * Công cụ vốn chạy bằng MỘT tài khoản `admin` dùng chung. Chia ra mười tài
 * khoản không phải để làm cho đẹp: chỉ có một worker chạy tuần tự trên một IP
 * văn phòng, nên quyền đặt lệnh quét phải nằm trong tay vài người biết mình
 * đang đặt bao nhiêu giờ máy, còn sale thì đọc dữ liệu và chăm sóc lead.
 *
 * Cỡ trang 20 như màn Job: cả công ty có khoảng chục tài khoản, phân trang ở
 * đây chỉ là đi cho đúng đường chung để mai kia thêm người không phải sửa gì.
 */

const USERS_PAGE_SIZE = 20;

export function UsersScreen() {
  const [page, setPage] = useState(1);
  const me = useCurrentUser();
  const { data, isPending, isError, error, refetch, isFetching } = useUsers({
    page,
    size: USERS_PAGE_SIZE,
  });

  /*
   * Cổng chặn ở màn này đọc thẳng `/auth/me` chứ KHÔNG dùng `useIsAdmin()`.
   *
   * `useIsAdmin()` đọc bản sao vai trò trong localStorage — thứ dựng cho các
   * nút vẽ kịp khung hình đầu, và nó RỖNG với phiên mở từ trước khi có phân
   * quyền. Lấy nó ra chặn cửa thì một admin thật đang có token hợp lệ sẽ bị
   * đuổi khỏi trang của chính mình cho tới khi /auth/me trả lời. Mất một nhịp
   * chờ ở đây đổi lấy việc không đuổi nhầm ai — đáng.
   *
   * Và như mọi chỗ khác: đây chỉ là chuyện vẽ gì ra màn hình. Chặn thật là 403
   * của backend trên mọi endpoint /users.
   */
  if (me.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (me.data?.role !== "admin") {
    return (
      <EmptyState
        icon={<ShieldAlertIcon className="size-5" />}
        title="Trang này chỉ dành cho quản trị viên"
        description="Tài khoản của bạn xem và xuất được dữ liệu, chăm sóc lead, nhưng không quản lý được tài khoản. Cần thêm quyền thì báo quản trị viên."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản lý tài khoản"
        description="Ai được đặt lệnh quét, ai chỉ đọc dữ liệu."
        actions={<CreateUserDialog />}
      />

      <Card size="sm" className="gap-0 py-0">
        {isPending ? (
          <TableSkeleton columns={USER_TABLE_COLUMNS} rows={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            {/*
             * Giữ dữ liệu cũ khi đổi trang (keepPreviousData) và chỉ làm mờ đi
             * — bảng không nháy về skeleton giữa chừng.
             */}
            <div
              className={isFetching ? "opacity-60 transition-opacity" : undefined}
            >
              <UsersTable accounts={data.items} currentUserId={me.data.id} />
            </div>
            <PaginationBar
              page={data.page}
              size={data.size}
              total={data.total}
              pages={data.pages}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </Card>
    </div>
  );
}
