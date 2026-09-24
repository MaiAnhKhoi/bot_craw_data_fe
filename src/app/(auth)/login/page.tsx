import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/features/auth/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

/* Màn đăng nhập — page chỉ dựng bố cục, form nằm trong features/auth. */
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/*
        * Logo đứng riêng một khối, cách tiêu đề một khoảng rõ ràng. Bản đầu nhét
        * chung `space-y-2` với h1 nên logo và chữ dính sát nhau, trông như một
        * cục — logo là chữ, tiêu đề cũng là chữ, không có gì tách hai lớp đó ra.
        */}
      <div className="space-y-5 text-center">
        <Logo size="lg" className="mx-auto" />
        <div className="space-y-1.5">
          <h1 className="font-heading text-xl font-semibold">Bot Craw Data</h1>
          <p className="text-sm text-muted-foreground">
            Công cụ nội bộ thu thập lead doanh nghiệp từ Google Maps.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <LoginForm />
      </div>
    </div>
  );
}
