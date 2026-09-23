"use client";

import { CircleAlertIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/*
 * Trạng thái lỗi dùng chung.
 *
 * Luôn hiện THÔNG ĐIỆP thật của backend chứ không nuốt lỗi thành "chưa có dữ
 * liệu" — bảng trống vì 403 và bảng trống vì hết dữ liệu là hai chuyện khác
 * hẳn nhau, gộp lại thì người dùng chỉ phát hiện ra khi mở F12.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlertIcon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Không tải được dữ liệu</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {errorMessage(error)}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon />
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
