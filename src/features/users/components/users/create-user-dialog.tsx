"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RoleSelect } from "@/features/users/components/users/role-select";
import { useCreateUser } from "@/features/users/hooks/use-user-mutations";
import {
  CREATE_USER_DEFAULTS,
  createUserSchema,
  toAccountCreate,
  type CreateUserInput,
} from "@/features/users/schemas/user-schema";
import { userRoleMeta } from "@/types/domain";

/*
 * Hộp thoại thêm tài khoản.
 *
 * Admin gõ luôn mật khẩu đầu tiên rồi đọc cho nhân viên — công cụ nội bộ, không
 * có email để gửi link đặt mật khẩu. Người nhận tự đổi lại bằng "Đổi mật khẩu"
 * trong menu tài khoản, nên mật khẩu này chỉ sống đến lần đăng nhập đầu.
 *
 * KHÔNG có ô "nhập lại mật khẩu" như hai form kia: ở đây admin vừa gõ vừa đọc
 * cho người dùng thử ngay, sai thì biết trong một phút. Thêm một ô nữa chỉ làm
 * chậm việc tạo mười tài khoản liên tiếp.
 */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const taoTaiKhoan = useCreateUser();

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: CREATE_USER_DEFAULTS,
  });

  const errors = form.formState.errors;
  /*
   * `useWatch` thay cho `form.watch(...)`: nó trả về GIÁ TRỊ, còn `watch` trả
   * về một hàm mà React Compiler không memo hoá an toàn được.
   */
  const role = useWatch({ control: form.control, name: "role" });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(CREATE_USER_DEFAULTS);
  };

  const onSubmit = form.handleSubmit((input) => {
    taoTaiKhoan.mutate(toAccountCreate(input), {
      onSuccess: () => handleOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        Thêm tài khoản
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu đầu tiên rồi đưa cho người dùng. Họ tự đổi lại được
            trong menu tài khoản.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="new-username">Tên đăng nhập</FieldLabel>
              <Input
                id="new-username"
                placeholder="vd: khoa.nguyen"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={!!errors.username}
                {...form.register("username")}
              />
              <FieldError errors={[errors.username]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-user-password">Mật khẩu</FieldLabel>
              {/*
               * `type="text"`: admin phải ĐỌC ĐƯỢC mật khẩu mình vừa gõ để đọc
               * cho nhân viên. Che bằng dấu chấm ở đây không bảo vệ được gì —
               * người biết mật khẩu chính là người đang ngồi trước màn hình.
               */}
              <Input
                id="new-user-password"
                type="text"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-full-name">
                Họ tên (không bắt buộc)
              </FieldLabel>
              <Input
                id="new-full-name"
                placeholder="vd: Nguyễn Đăng Khoa"
                autoComplete="off"
                aria-invalid={!!errors.full_name}
                {...form.register("full_name")}
              />
              <FieldError errors={[errors.full_name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-role">Vai trò</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <RoleSelect
                    id="new-role"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <FieldDescription>{userRoleMeta(role)?.hint}</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Huỷ
            </DialogClose>
            <Button type="submit" disabled={taoTaiKhoan.isPending}>
              {taoTaiKhoan.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
