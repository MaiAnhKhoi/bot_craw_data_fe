"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createJob,
  runJobAction,
  type JobAction,
} from "@/features/jobs/api/jobs-api";
import { jobKeys } from "@/features/jobs/hooks/use-jobs";
import { ApiError, errorMessage } from "@/lib/api";
import type { Job, JobCreate, JobDetail } from "@/features/jobs/types/job";

/* Tạo job mới rồi làm mới danh sách. */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: JobCreate) => createJob(input),
    onSuccess: (job) => {
      toast.success(`Đã tạo job "${job.name}".`);
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không tạo được job."));
    },
  });
}

const ACTION_LABEL: Record<JobAction, string> = {
  pause: "Đã tạm dừng job.",
  resume: "Đã chạy tiếp job.",
  cancel: "Đã huỷ job.",
};

/*
 * Tạm dừng / chạy tiếp / huỷ job.
 *
 * Backend trả `JOB_INVALID_STATE` (409) khi trạng thái không cho phép chuyển —
 * ví dụ bấm "Tạm dừng" đúng lúc job vừa xong. Đây KHÔNG phải lỗi hệ thống nên
 * hiện dạng cảnh báo và nạp lại dữ liệu để nút hiển thị đúng trạng thái thật.
 */
export function useJobAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: JobAction }) =>
      runJobAction(id, action),
    onSuccess: (job: Job, variables) => {
      toast.success(ACTION_LABEL[variables.action]);
      // Vá vào bản chi tiết đang có để KHÔNG mất mảng `queries` (endpoint
      // pause/resume/cancel chỉ trả về Job, không kèm danh sách truy vấn con).
      queryClient.setQueryData<JobDetail>(jobKeys.detail(job.id), (previous) =>
        previous ? { ...previous, ...job } : previous,
      );
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "JOB_INVALID_STATE") {
        toast.warning("Job đã đổi trạng thái, không thực hiện được thao tác này.");
      } else {
        toast.error(errorMessage(error, "Thao tác thất bại."));
      }
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
