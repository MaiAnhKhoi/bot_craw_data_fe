"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reverifyPlace } from "@/features/places/api/places-api";
import { placeKeys } from "@/features/places/hooks/use-places";
import { errorMessage } from "@/lib/api";

/*
 * "Kiểm tra lại" một địa điểm: đặt nó về hàng đợi để worker quét lại.
 * Sau khi thành công thì làm mới danh sách để cột Tình trạng hiện đúng —
 * điểm sống/chết sẽ được worker tính lại ở lần quét tới.
 */
export function useReverifyPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reverifyPlace(id),
    onSuccess: (place) => {
      toast.success(`Đã đưa "${place.name}" vào hàng chờ kiểm tra lại.`);
      queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không gửi được yêu cầu kiểm tra lại."));
    },
  });
}
