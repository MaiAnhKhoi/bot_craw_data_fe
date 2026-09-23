import { cn } from "@/lib/utils";

/*
 * Thanh tiến độ. Viết tay bằng div thay vì lấy primitive ngoài: nó chỉ là một
 * thanh nền + một thanh phủ, thêm thư viện cho việc này là thừa (Rule 1).
 *
 * Hiệu ứng CHỈ bằng CSS transform (rẻ, chạy trên GPU) và tự tắt khi người dùng
 * bật "giảm chuyển động" của hệ điều hành — tiến độ job cập nhật mỗi 2 giây qua
 * SSE nên chuyển động liên tục dễ gây khó chịu.
 */
export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: React.ComponentProps<"div"> & {
  /** 0..100. Giá trị ngoài khoảng sẽ được kẹp lại. */
  value: number;
  indicatorClassName?: string;
}) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - safe}%)` }}
      />
    </div>
  );
}
