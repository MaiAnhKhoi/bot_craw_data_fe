import { UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { userRoleMeta } from "@/types/domain";
import { UserRowActions } from "@/features/users/components/users/user-row-actions";
import type { Account } from "@/features/users/types/user";

/* Nhãn cột — khai một chỗ để skeleton dùng lại đúng bộ cột của bảng thật. */
export const USER_TABLE_COLUMNS = [
  "Tên đăng nhập",
  "Họ tên",
  "Vai trò",
  "Trạng thái",
  "Ngày tạo",
  "Hành động",
];

/*
 * Màu huy hiệu trạng thái, theo đúng cách đã dùng ở cột Chăm sóc bên Địa điểm:
 * trạng thái PHỔ BIẾN (đang dùng) là ô rỗng viền nhạt, trạng thái cần để mắt
 * (đã khoá) mới có nền đặc và nét gạch ngang. Tô đậm cả bảng thì màu không còn
 * nói được gì — thứ duy nhất phải nổi lên là những tài khoản không vào được nữa.
 */
const TRANG_THAI = {
  active: {
    label: "Đang dùng",
    badgeClass: "border-border bg-transparent text-muted-foreground",
  },
  locked: {
    label: "Đã khoá",
    badgeClass: "bg-muted text-muted-foreground line-through",
  },
};

/*
 * Bảng tài khoản. Dữ liệu do màn cha nạp (phân trang ở server).
 *
 * `currentUserId` để đánh dấu chính mình. Backend đã chặn các ca tự hại (tự
 * khoá mình, tự hạ vai trò khi là admin cuối cùng), nhưng nhìn thấy trước vẫn
 * hơn là bấm rồi đọc thông báo từ chối.
 */
export function UsersTable({
  accounts,
  currentUserId,
}: {
  accounts: Account[];
  currentUserId?: number;
}) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="size-5" />}
        title="Chưa có tài khoản nào"
        description='Bấm "Thêm tài khoản" để tạo tài khoản đầu tiên cho nhân viên sale.'
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {USER_TABLE_COLUMNS.map((column) => (
            <TableHead key={column} className="first:pl-4 last:pr-4">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const role = userRoleMeta(account.role);
          const trangThai = account.is_active
            ? TRANG_THAI.active
            : TRANG_THAI.locked;
          const laChinhMinh = account.id === currentUserId;

          return (
            <TableRow key={account.id}>
              {/*
               * `block truncate` là bắt buộc: TableCell mang sẵn
               * `whitespace-nowrap` nên `max-w-*` một mình chỉ giới hạn bề rộng
               * ô, chữ vẫn tràn ra và vẽ đè lên cột bên cạnh.
               */}
              <TableCell className="max-w-48 pl-4 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="truncate" title={account.username}>
                    {account.username}
                  </span>
                  {laChinhMinh ? (
                    <Badge variant="outline" className="font-normal">
                      Bạn
                    </Badge>
                  ) : null}
                </span>
              </TableCell>
              <TableCell className="max-w-56 text-muted-foreground">
                <span
                  className="block truncate"
                  title={account.full_name ?? undefined}
                >
                  {account.full_name || "—"}
                </span>
              </TableCell>
              <TableCell>
                {role ? (
                  <Badge
                    variant="secondary"
                    className={cn("font-normal", role.badgeClass)}
                    title={role.hint}
                  >
                    {role.label}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("font-normal", trangThai.badgeClass)}
                >
                  {trangThai.label}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(account.created_at)}
              </TableCell>
              <TableCell className="pr-4">
                <UserRowActions account={account} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
