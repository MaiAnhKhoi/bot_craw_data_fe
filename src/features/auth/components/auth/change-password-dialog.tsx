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
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import {
  CHANGE_PASSWORD_DEFAULTS,
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/features/auth/schemas/change-password-schema";

/*
 * Hộp thoại tự đổi mật khẩu, mở từ menu tài khoản trên header.
 *
 * AI CŨNG DÙNG ĐƯỢC, kể cả sale: cả công ty đang chung một tài khoản `admin`,
 * và bước đầu tiên khi chia ra mười tài khoản là mỗi người tự đặt mật khẩu
 * riêng — nếu việc đó phải nhờ admin thì sẽ không ai làm.
 *
 * Dùng Dialog chứ không phải Sheet (form tạo job dùng Sheet): ba ô một dòng,
 * không có gì để cuộn, và hộp thoại giữa màn hình giữ người dùng ở nguyên chỗ
 * họ đang đứng.
 *
 * Trạng thái mở do header giữ, không phải trigger bên trong: mục menu bị Base
 * UI đóng ngay khi bấm, nên hộp thoại phải sống ngoài cây của menu mới không
 * bị gỡ khỏi DOM cùng lúc.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const doiMatKhau = useChangePassword();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: CHANGE_PASSWORD_DEFAULTS,
  });

  const errors = form.formState.errors;

  /*
   * Đóng là XOÁ SẠCH ba ô. Mật khẩu không phải thứ để nằm lại trong DOM chờ
   * lần mở sau — nhất là trên máy dùng chung ngoài văn phòng.
   */
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) form.reset(CHANGE_PASSWORD_DEFAULTS);
  };

  const onSubmit = form.handleSubmit((input) => {
    doiMatKhau.mutate(
      {
        current_password: input.current_password,
        new_password: input.new_password,
      },
      { onSuccess: () => handleOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Đổi mật khẩu của chính bạn. Phiên đang đăng nhập vẫn chạy tiếp, chỉ
            lần đăng nhập sau mới cần mật khẩu mới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="current-password">
                Mật khẩu hiện tại
              </FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.current_password}
                {...form.register("current_password")}
              />
              <FieldError errors={[errors.current_password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-password">Mật khẩu mới</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.new_password}
                {...form.register("new_password")}
              />
              <FieldError errors={[errors.new_password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Nhập lại mật khẩu mới
              </FieldLabel>
              {/*
               * Ô này KHÔNG gửi lên. Nó ở đây vì gõ lệch một ký tự trong ô trên
               * là tự khoá mình ra khỏi công cụ, và tài khoản sale thì phải nhờ
               * admin đặt lại mới vào được.
               */}
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
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
            <Button type="submit" disabled={doiMatKhau.isPending}>
              {doiMatKhau.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
