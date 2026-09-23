"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { CreateJobSheet } from "@/features/jobs/components/jobs/create-job-sheet";
import {
  JOB_TABLE_COLUMNS,
  JobsTable,
} from "@/features/jobs/components/jobs/jobs-table";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
import { JOB_STATUS_META } from "@/features/jobs/lib/job-status";
import type { JobStatus } from "@/features/jobs/types/job";

/*
 * Màn danh sách job: lọc theo trạng thái + phân trang Ở SERVER.
 *
 * Cỡ trang nhỏ hơn màn Địa điểm (20) vì mỗi dòng cao hơn hẳn (có thanh tiến độ
 * và cụm nút) — nạp 50 dòng chỉ để người dùng cuộn qua là phí băng thông.
 */

const JOBS_PAGE_SIZE = 20;
const ALL_STATUS = "all";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: ALL_STATUS, label: "Tất cả trạng thái" },
  ...(Object.keys(JOB_STATUS_META) as JobStatus[]).map((status) => ({
    value: status,
    label: JOB_STATUS_META[status].label,
  })),
];

export function JobsScreen() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(ALL_STATUS);

  const { data, isPending, isError, error, refetch, isFetching } = useJobs({
    page,
    size: JOBS_PAGE_SIZE,
    status: status === ALL_STATUS ? undefined : (status as JobStatus),
  });

  const currentStatusLabel =
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    STATUS_OPTIONS[0].label;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Job quét"
        description="Đặt lệnh quét Google Maps và theo dõi tiến độ."
        actions={<CreateJobSheet />}
      />

      <Card size="sm" className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Select
            value={status}
            onValueChange={(value) => {
              if (!value) return;
              setStatus(value as string);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue>{() => currentStatusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPending ? (
          <TableSkeleton columns={JOB_TABLE_COLUMNS} rows={6} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <div
              // Giữ dữ liệu cũ khi đổi trang (keepPreviousData) và chỉ làm mờ
              // đi — bảng không nháy về skeleton giữa chừng.
              className={
                isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              <JobsTable jobs={data.items} />
            </div>
            <PaginationBar
              page={data.page}
              size={data.size}
              total={data.total}
              pages={data.pages}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </Card>
    </div>
  );
}
