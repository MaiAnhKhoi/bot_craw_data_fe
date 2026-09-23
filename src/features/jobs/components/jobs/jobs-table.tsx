"use client";

import Link from "next/link";
import { BriefcaseIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { JobActionButtons } from "@/features/jobs/components/shared/job-action-buttons";
import { JobProgress } from "@/features/jobs/components/shared/job-progress";
import { JobStatusBadge } from "@/features/jobs/components/shared/job-status-badge";
import type { Job } from "@/features/jobs/types/job";

/* Nhãn cột — khai một chỗ để skeleton dùng lại đúng bộ cột của bảng thật. */
export const JOB_TABLE_COLUMNS = [
  "Tên job",
  "Trạng thái",
  "Tiến độ",
  "Địa điểm",
  "Thời gian",
  "Hành động",
];

/* Bảng danh sách job. Dữ liệu do màn cha nạp (phân trang ở server). */
export function JobsTable({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<BriefcaseIcon className="size-5" />}
        title="Chưa có job nào"
        description='Bấm "Tạo job" để đặt lệnh quét đầu tiên.'
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {JOB_TABLE_COLUMNS.map((column) => (
            <TableHead key={column} className="first:pl-4 last:pr-4">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="max-w-64 pl-4">
              <Link
                href={ROUTES.jobDetail(job.id)}
                className="font-medium hover:underline"
              >
                {job.name}
              </Link>
              <span className="block truncate text-xs text-muted-foreground">
                {job.params.keywords.join(", ")}
              </span>
            </TableCell>
            <TableCell>
              <JobStatusBadge status={job.status} />
            </TableCell>
            <TableCell>
              <JobProgress job={job} />
            </TableCell>
            <TableCell className="tabular-nums">
              {formatNumber(job.total_places)}
              <span className="block text-xs text-muted-foreground">
                {formatNumber(job.new_places)} mới
              </span>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <span className="block">Tạo: {formatDateTime(job.created_at)}</span>
              {job.finished_at ? (
                <span className="block">
                  Xong: {formatDateTime(job.finished_at)}
                </span>
              ) : null}
            </TableCell>
            <TableCell className="pr-4">
              <JobActionButtons job={job} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
