"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSplitJob,
  previewSplit,
} from "@/features/remaining-areas/api/remaining-areas-api";
import { remainingAreaKeys } from "@/features/remaining-areas/hooks/use-remaining-areas";
import { jobKeys } from "@/features/jobs/hooks/use-jobs";
import { errorMessage } from "@/lib/api";
import type { Job } from "@/features/jobs/types/job";
import type { RemainingSplitRequest } from "@/features/remaining-areas/types/remaining-area";

/*
 * Bản xem trước của job chia nhỏ.
 *
 * Là useQuery chứ không phải mutation, dù gọi POST: nó KHÔNG đổi gì ở server,
 * và người dùng sẽ bật tắt từng dòng liên tục trong lúc cân nhắc. Cache theo
 * danh sách truy vấn nên bỏ chọn một dòng rồi chọn lại không phải hỏi lại
 * server, còn `enabled` giữ cho panel chưa mở thì không gọi gì.
 *
 * `max_results_per_query` CỐ TÌNH không nằm trong khoá: nó chỉ đổi trần của job,
 * không đổi danh sách truy vấn sinh ra. Đưa vào khoá là mỗi lần gõ một chữ số
 * lại bắn một request cho cùng một đáp án.
 */
export function useSplitPreview(queries: string[], enabled: boolean) {
  return useQuery({
    queryKey: [...remainingAreaKeys.all, "split-preview", queries] as const,
    queryFn: ({ signal }) => previewSplit({ queries }, signal),
    enabled: enabled && queries.length > 0,
    // Danh sách này chỉ đổi khi một truy vấn chạy xong — mà một truy vấn tốn
    // 1-3 phút. Trong một lượt cân nhắc thì nó đứng yên.
    staleTime: 60_000,
  });
}

/* Tạo job chia nhỏ, rồi làm mới cả bảng Job lẫn bảng Địa bàn còn sót. */
export function useCreateSplitJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemainingSplitRequest) => createSplitJob(input),
    onSuccess: (job: Job) => {
      toast.success(
        `Đã tạo job "${job.name}" với ${job.total_queries} truy vấn.`,
      );
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      /*
       * Bảng địa bàn còn sót cũng phải nạp lại: job mới đã thêm những dòng
       * `job_queries` đang chờ chạy, và luật "lần quét gần nhất" đọc qua mọi
       * job — để bảng cũ nguyên là người dùng dễ bấm tạo thêm lần nữa.
       */
      queryClient.invalidateQueries({ queryKey: remainingAreaKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không tạo được job chia nhỏ."));
    },
  });
}
