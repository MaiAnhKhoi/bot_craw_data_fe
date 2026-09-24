"use client";

import { useState } from "react";
import {
  KeyRoundIcon,
  LoaderCircleIcon,
  LockOpenIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "@/features/users/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/features/users/components/users/reset-password-dialog";
import { useUnlockUser } from "@/features/users/hooks/use-user-mutations";
import { accountLockState } from "@/features/users/lib/account-lock";
import type { Account } from "@/features/users/types/user";

/*
 * Việc admin làm với một dòng: sửa thông tin (họ tên, vai trò, khoá/mở), đặt
 * lại mật khẩu, và gỡ khoá tạm khi dòng đó đang dính.
 *
 * Để THẲNG thành nút chứ không giấu sau menu ba chấm: bảng chỉ có mươi dòng và
 * mỗi nút là một việc rõ ràng — nhét vào menu thì thêm đúng một cú bấm cho mọi
 * thao tác mà chẳng gọn thêm được gì.
 *
 * Trạng thái mở của hộp thoại nằm ở đây, ngay cạnh dòng, để mỗi dòng tự giữ
 * dữ liệu của mình — không phải nâng `account` đang chọn lên tận màn cha rồi
 * lại phải nhớ dọn nó đi.
 */
export function UserRowActions({ account }: { account: Account }) {
  const [suaOpen, setSuaOpen] = useState(false);
  const [matKhauOpen, setMatKhauOpen] = useState(false);
  const moKhoa = useUnlockUser();

  const dangKhoaTam = accountLockState(account) === "temporary";

  return (
    <div className="flex items-center gap-1.5">
      {/*
       * "Mở khoá" CHỈ hiện khi đang bị khoá tạm, và đứng ĐẦU hàng: lúc nó hiện
       * ra thì nó chính là việc admin mở màn này để làm, còn lúc không có khoá
       * thì một nút mở khoá luôn nằm đó chỉ tổ mời người ta bấm nhầm.
       *
       * Không hỏi lại trước khi bấm: khoá tạm vốn tự hết sau vài phút, mở sớm
       * hơn mươi phút không phá hỏng thứ gì — và nếu mật khẩu đang thật sự bị
       * dò thì lần sai tiếp theo lại khoá lại ngay.
       */}
      {dangKhoaTam ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => moKhoa.mutate(account.id)}
          disabled={moKhoa.isPending}
        >
          {moKhoa.isPending ? (
            <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <LockOpenIcon />
          )}
          Mở khoá
        </Button>
      ) : null}
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
