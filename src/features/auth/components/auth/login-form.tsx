"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, LoaderCircleIcon, LockIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { useLogin } from "@/features/auth/hooks/use-login";
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
