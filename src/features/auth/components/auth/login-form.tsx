"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlertIcon,
  LoaderCircleIcon,
  LockIcon,
  TimerIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLogin } from "@/features/auth/hooks/use-login";
import { describeLoginError } from "@/features/auth/lib/login-error";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/login-schema";

/*
 * Form đăng nhập: React Hook Form + Zod resolver.
 * Form thuần — bố cục/thương hiệu nằm ở (auth)/login/page.tsx.
 * Gọi API qua useLogin; component không biết axios là gì.
 */

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <CircleAlertIcon className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

/*
 * Lỗi của CẢ FORM — thứ backend trả về, khác `FieldMessage` là lỗi của một ô.
 *
 * Ca bị khoá tạm mặc màu hổ phách kèm biểu tượng đồng hồ chứ không phải màu lỗi
 * đỏ, vì nó không có nghĩa là "bạn gõ sai" mà là "chưa tới lượt bạn" — một
 * trạng thái tự hết sau ít phút. Vẽ giống hệt ca sai mật khẩu thì người đang gõ
 * ĐÚNG mật khẩu vẫn tưởng mình gõ sai nên gõ lại, mà mỗi lần gõ lại là một lần
 * bị đếm và khoá dài thêm.
 *
 * Hiện NGUYÊN VĂN câu của backend: chỉ nó mới biết còn phải chờ bao nhiêu phút,
 * và biết lần này là chặn theo tài khoản hay theo địa chỉ IP.
 */
function FormMessage({ error }: { error: unknown }) {
  const loi = describeLoginError(error);
  if (!loi) return null;

  const khoaTam = loi.kind === "locked";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl px-3 py-2.5",
        khoaTam
          ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {khoaTam ? (
        <TimerIcon className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{loi.message}</p>
        {loi.hint ? <p className="text-xs opacity-90">{loi.hint}</p> : null}
      </div>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit((input) =>
        loginMutation.mutate(input, {
          onSuccess: () => router.replace(ROUTES.dashboard),
        }),
      )}
      noValidate
    >
      <FieldGroup className="gap-4.5">
        <FormMessage error={loginMutation.error} />

        <Field>
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="username"
              className="h-11 rounded-xl bg-background pl-10"
              placeholder="vd: admin"
              autoComplete="username"
              autoFocus
              aria-invalid={!!errors.username}
              {...form.register("username")}
            />
          </div>
          <FieldMessage message={errors.username?.message} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="password"
              type="password"
              className="h-11 rounded-xl bg-background pl-10"
              placeholder="Mật khẩu"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
          </div>
          <FieldMessage message={errors.password?.message} />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-xl text-[15px] font-semibold"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
          ) : null}
          Đăng nhập
        </Button>
      </FieldGroup>
    </form>
  );
}
