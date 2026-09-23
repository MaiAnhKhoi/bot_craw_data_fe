/*
 * Khung của các màn công khai (hiện chỉ có /login): nền nhạt, nội dung canh
 * giữa. Không có sidebar/header vì chưa đăng nhập thì chưa có gì để điều hướng.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      {children}
    </div>
  );
}
