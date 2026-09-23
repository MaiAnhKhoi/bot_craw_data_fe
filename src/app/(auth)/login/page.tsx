import type { Metadata } from "next";
import { RadarIcon } from "lucide-react";
import { LoginForm } from "@/features/auth/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

/* Màn đăng nhập — page chỉ dựng bố cục, form nằm trong features/auth. */
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <RadarIcon className="size-5.5" />
        </span>
        <h1 className="font-heading text-xl font-semibold">Bot Craw Data</h1>
        <p className="text-sm text-muted-foreground">
          Công cụ nội bộ thu thập lead doanh nghiệp từ Google Maps.
        </p>
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <LoginForm />
      </div>
    </div>
  );
}
