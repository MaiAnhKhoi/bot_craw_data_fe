"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RoleSelect } from "@/features/users/components/users/role-select";
import { useUpdateUser } from "@/features/users/hooks/use-user-mutations";
import {
  toAccountUpdate,
  updateUserSchema,
  type UpdateUserInput,
} from "@/features/users/schemas/user-schema";
import { userRoleMeta } from "@/types/domain";
import type { Account } from "@/features/users/types/user";

/*
 * Hộp thoại sửa một tài khoản: họ tên, vai trò, khoá/mở khoá.
 *
 * KHÔNG sửa được tên đăng nhập — đó là thứ người ta gõ hằng ngày và là đầu mối
 * để dò lại xem ai đã đặt job nào; đổi nó thì lợi bất cập hại.
 *
 * KHÔNG có nút xoá: khoá lại là đủ để chặn đăng nhập mà vẫn giữ nguyên lịch sử.
 * Xoá hẳn một tài khoản đã từng đặt job là tự tay cắt đường truy vết.
 *
 * Các ca backend sẽ TỪ CHỐI (tự khoá mình, hạ vai trò của admin cuối cùng)
 * không được đoán trước ở đây: chỉ server mới biết còn mấy admin, và đoán sai
 * thì hoặc là chặn oan, hoặc là cho bấm rồi mới báo lỗi. Cứ gửi lên và hiện
 * NGUYÊN VĂN câu từ chối của nó.
 */
export function EditUserDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const capNhat = useUpdateUser();

  const giaTriBanDau: UpdateUserInput = {
    full_name: account.full_name ?? "",
    role: account.role,
    is_active: account.is_active,
  };

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: giaTriBanDau,
  });

  const errors = form.formState.errors;
  const role = useWatch({ control: form.control, name: "role" });

  /*
   * Nạp lại giá trị mỗi lần MỞ, không phải mỗi lần `account` đổi: hộp thoại này
   * sống cùng dòng bảng và dòng đó được vẽ lại sau mỗi lượt làm mới danh sách.
   * Nếu đồng bộ theo `account` thì một lượt refetch rơi vào giữa lúc admin đang
   * gõ sẽ xoá sạch thứ họ vừa nhập.
   */
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next) form.reset(giaTriBanDau);
  };

  const onSubmit = form.handleSubmit((input) => {
    capNhat.mutate(
      { id: account.id, input: toAccountUpdate(input) },
      { onSuccess: () => onOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa tài khoản</DialogTitle>
          <DialogDescription>
            Tên đăng nhập <span className="font-mono">{account.username}</span>{" "}
            không đổi được.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={`full-name-${account.id}`}>Họ tên</FieldLabel>
              <Input
                id={`full-name-${account.id}`}
                placeholder="vd: Nguyễn Đăng Khoa"
                autoComplete="off"
                aria-invalid={!!errors.full_name}
                {...form.register("full_name")}
              />
              <FieldError errors={[errors.full_name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor={`role-${account.id}`}>Vai trò</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <RoleSelect
                    id={`role-${account.id}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <FieldDescription>{userRoleMeta(role)?.hint}</FieldDescription>
            </Field>

            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                  <span>
                    Cho phép đăng nhập
                    <span className="block text-xs font-normal text-muted-foreground">
                      Tắt là khoá tài khoản: không đăng nhập được nữa nhưng mọi
                      dữ liệu và lịch sử vẫn còn nguyên.
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </label>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Huỷ
            </DialogClose>
            <Button type="submit" disabled={capNhat.isPending}>
              {capNhat.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
