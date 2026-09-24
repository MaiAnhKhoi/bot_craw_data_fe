"use client";

import { useState } from "react";
import { KeyRoundIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "@/features/users/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/features/users/components/users/reset-password-dialog";
import type { Account } from "@/features/users/types/user";

/*
 * Hai việc admin làm với một dòng: sửa thông tin (họ tên, vai trò, khoá/mở) và
 * đặt lại mật khẩu.
 *
 * Để THẲNG thành hai nút chứ không giấu sau menu ba chấm: bảng chỉ có mươi dòng
 * và mỗi nút là một việc rõ ràng — nhét vào menu thì thêm đúng một cú bấm cho
 * mọi thao tác mà chẳng gọn thêm được gì.
 *
 * Trạng thái mở của hộp thoại nằm ở đây, ngay cạnh dòng, để mỗi dòng tự giữ
 * dữ liệu của mình — không phải nâng `account` đang chọn lên tận màn cha rồi
 * lại phải nhớ dọn nó đi.
 */
export function UserRowActions({ account }: { account: Account }) {
  const [suaOpen, setSuaOpen] = useState(false);
  const [matKhauOpen, setMatKhauOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" onClick={() => setSuaOpen(true)}>
        <PencilIcon />
        Sửa
      </Button>
      <Button variant="outline" size="sm" onClick={() => setMatKhauOpen(true)}>
        <KeyRoundIcon />
        Đặt lại mật khẩu
      </Button>

      <EditUserDialog
        account={account}
        open={suaOpen}
        onOpenChange={setSuaOpen}
      />
      <ResetPasswordDialog
        account={account}
        open={matKhauOpen}
        onOpenChange={setMatKhauOpen}
      />
    </div>
  );
}
