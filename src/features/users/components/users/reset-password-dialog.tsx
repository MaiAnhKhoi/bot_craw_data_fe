"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetUserPassword } from "@/features/users/hooks/use-user-mutations";
import {
  RESET_PASSWORD_DEFAULTS,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/users/schemas/user-schema";
import type { Account } from "@/features/users/types/user";

/*
 * Admin đặt lại mật khẩu hộ một tài khoản khác.
 *
 * KHÔNG hỏi mật khẩu cũ — tình huống dùng đến nút này luôn là "nhân viên quên
 * mật khẩu", mà nếu admin biết mật khẩu cũ thì đã chẳng cần nút này.
 *
 * CÓ ô nhập lại (khác với form thêm tài khoản): ở đây admin gõ một mật khẩu mà
 * chính mình không dùng và cũng không thử ngay được, gõ lệch một ký tự thì phải
 * chờ nhân viên báo không đăng nhập được mới biết.
 */
export function ResetPasswordDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const datLai = useResetUserPassword();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: RESET_PASSWORD_DEFAULTS,
  });

  const errors = form.formState.errors;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) form.reset(RESET_PASSWORD_DEFAULTS);
  };

  const onSubmit = form.handleSubmit((input) => {
    datLai.mutate(
      { id: account.id, newPassword: input.new_password },
      { onSuccess: () => handleOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho{" "}
            <span className="font-mono">{account.username}</span>. Mật khẩu cũ
            mất hiệu lực ngay, nhớ báo lại cho người dùng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`reset-password-${account.id}`}>
                Mật khẩu mới
              </FieldLabel>
              {/*
               * Để chữ hiện rõ (`type="text"`): admin phải đọc lại được mật
               * khẩu vừa đặt để báo cho người dùng. Che đi không bảo vệ được ai
               * — người duy nhất đọc được nó đang ngồi trước màn hình.
               */}
              <Input
                id={`reset-password-${account.id}`}
                type="text"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                aria-invalid={!!errors.new_password}
                {...form.register("new_password")}
              />
              <FieldError errors={[errors.new_password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor={`reset-confirm-${account.id}`}>
                Nhập lại mật khẩu mới
              </FieldLabel>
              <Input
                id={`reset-confirm-${account.id}`}
                type="text"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                aria-invalid={!!errors.confirm_password}
                {...form.register("confirm_password")}
              />
              <FieldError errors={[errors.confirm_password]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Huỷ
            </DialogClose>
            <Button type="submit" disabled={datLai.isPending}>
              {datLai.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Đặt lại mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
