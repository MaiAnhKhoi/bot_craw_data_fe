import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_META } from "@/features/jobs/lib/job-status";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/features/jobs/types/job";

/* Huy hiệu trạng thái job — dùng ở cả bảng danh sách và màn chi tiết. */
export function JobStatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const meta = JOB_STATUS_META[status];
  return (
    <Badge variant="secondary" className={cn(meta.badgeClass, className)}>
      {meta.label}
    </Badge>
  );
}
