"use client";

import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/features/auth/hooks/use-is-admin";
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
 *
 * CHỈ ADMIN THẤY. Điều khiển worker là việc của người đặt lệnh: worker chạy
 * tuần tự, huỷ nhầm job của người khác là mất luôn nhiều giờ quét đã chạy.
 * Ẩn ở đây CHỈ để bớt nút cho gọn — backend mới là chỗ chặn thật, `/jobs/{id}/
 * {pause,resume,cancel}` trả 403 với tài khoản sale dù ai gọi bằng cách nào.
 */
export function JobActionButtons({
  job,
  size = "sm",
}: {
  job: Job;
  size?: "sm" | "default";
}) {
  const isAdmin = useIsAdmin();
  const action = useJobAction();
  const pending = action.isPending;

  /*
   * Gác ở ĐÂY chứ không ở hai nơi gọi (bảng job và màn chi tiết): cụm nút này
   * đi đâu thì luật đi theo đó, không ai phải nhớ kiểm tra lại lần nữa.
   */
  if (!isAdmin) return null;

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
