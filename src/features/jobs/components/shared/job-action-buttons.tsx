"use client";

import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobAction } from "@/features/jobs/hooks/use-job-mutations";
import {
  canCancel,
  canPause,
  canResume,
} from "@/features/jobs/lib/job-status";
import type { Job } from "@/features/jobs/types/job";

/*
 * Nút điều khiển job: tạm dừng / chạy tiếp / huỷ.
 *
 * Nút nào KHÔNG hợp lệ ở trạng thái hiện tại thì không render — người dùng
 * không phải đoán xem bấm có ăn không, và ta bớt hẳn một loại lỗi 409
 * (JOB_INVALID_STATE) do bấm nhầm.
 *
 * `size="sm"` cho bảng danh sách, `size="default"` cho màn chi tiết.
 */
export function JobActionButtons({
  job,
  size = "sm",
}: {
  job: Job;
  size?: "sm" | "default";
}) {
  const action = useJobAction();
  const pending = action.isPending;

  return (
    <div className="flex items-center gap-1.5">
      {canPause(job.status) ? (
        <Button
          variant="outline"
          size={size}
          disabled={pending}
          onClick={() => action.mutate({ id: job.id, action: "pause" })}
        >
          <PauseIcon />
          Tạm dừng
        </Button>
      ) : null}

      {canResume(job.status) ? (
        <Button
          variant="outline"
          size={size}
          disabled={pending}
          onClick={() => action.mutate({ id: job.id, action: "resume" })}
        >
          <PlayIcon />
          Chạy tiếp
        </Button>
      ) : null}

      {canCancel(job.status) ? (
        <Button
          variant="destructive"
          size={size}
          disabled={pending}
          onClick={() => action.mutate({ id: job.id, action: "cancel" })}
        >
          <XIcon />
          Huỷ
        </Button>
      ) : null}
    </div>
  );
}
