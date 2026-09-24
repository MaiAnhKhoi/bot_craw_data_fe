"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  USER_ROLE_META,
  USER_ROLE_ORDER,
  userRoleMeta,
  type UserRole,
} from "@/types/domain";

/*
 * Ô chọn vai trò, dùng chung cho form thêm và form sửa tài khoản.
 *
 * Mô tả của vai trò nằm DƯỚI ô chứ không nằm trong từng dòng danh sách:
 * `SelectItem` bọc nội dung trong `ItemText` với `whitespace-nowrap`, nhét hai
 * dòng vào đó là danh sách phình ngang ra khỏi ô. Để dưới còn được một cái lợi
 * nữa — người dùng đọc được hệ quả của lựa chọn HIỆN TẠI mà không phải mở
 * danh sách ra lần nữa.
 */
export function RoleSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next as UserRole);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{() => userRoleMeta(value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {USER_ROLE_ORDER.map((role) => (
          <SelectItem key={role} value={role}>
            {USER_ROLE_META[role].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
