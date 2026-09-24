import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { jobProgress } from "@/features/jobs/lib/job-status";
import type { Job } from "@/features/jobs/types/job";

/*
 * Thanh tiến độ của một job + con số phía trên.
 * Dùng chung ở bảng danh sách và màn chi tiết để hai nơi không bao giờ tính
 * phần trăm theo hai cách khác nhau.
 */
export function JobProgress({ job }: { job: Job }) {
  // Một nguồn duy nhất cho cả con số lẫn đơn vị — trước đây dòng chữ tự quyết
  // đơn vị bằng một điều kiện khác với chỗ tính phần trăm, nên có lúc hiện
  // "0/1.985 địa điểm · 0%" trong khi job đã chạy xong 38/168 truy vấn.
  const { percent, done, total, unit } = jobProgress(job);

  return (
    <div className="min-w-36 space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {formatNumber(done)}/{formatNumber(total)} {unit}
        </span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
