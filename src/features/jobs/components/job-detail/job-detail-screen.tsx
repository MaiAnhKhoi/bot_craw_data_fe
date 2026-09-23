"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  RadioIcon,
  WifiOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { JobQueriesTable } from "@/features/jobs/components/job-detail/job-queries-table";
import { JobActionButtons } from "@/features/jobs/components/shared/job-action-buttons";
import { JobProgress } from "@/features/jobs/components/shared/job-progress";
import { JobStatusBadge } from "@/features/jobs/components/shared/job-status-badge";
import { useJobEvents } from "@/features/jobs/hooks/use-job-events";
import { useJob } from "@/features/jobs/hooks/use-jobs";
import { JOB_PHASE_LABEL } from "@/types/domain";

/*
 * Màn chi tiết job.
 *
 * Tiến độ KHÔNG polling: `useJobEvents` mở SSE và vá thẳng vào cache của
 * `useJob`, nên mọi con số dưới đây tự cập nhật mỗi 2 giây mà màn không phải
 * gọi thêm request nào. Hook tự đóng kết nối khi job xong và tự dọn khi rời màn.
 */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <span
      className={
        connected
          ? "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          : "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      }
    >
      {connected ? (
        <RadioIcon className="size-3.5" />
      ) : (
        <WifiOffIcon className="size-3.5" />
      )}
      {connected ? "Đang nhận tiến độ trực tiếp" : "Mất kết nối trực tiếp"}
    </span>
  );
}

export function JobDetailScreen({ jobId }: { jobId: number }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId);
  const { connected, finished } = useJobEvents(jobId);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !job) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href={ROUTES.jobs} />}
      >
        <ArrowLeftIcon />
        Tất cả job
      </Button>

      <PageHeader
        title={job.name}
        description={job.params.keywords.join(" · ")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`${ROUTES.places}?job_id=${job.id}`} />}
            >
              <ExternalLinkIcon />
              Xem địa điểm của job
            </Button>
            <JobActionButtons job={job} />
          </>
        }
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <span className="text-sm font-normal text-muted-foreground">
              {JOB_PHASE_LABEL[job.phase]}
            </span>
            {finished ? null : <LiveIndicator connected={connected} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JobProgress job={job} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Truy vấn"
              value={`${formatNumber(job.done_queries)}/${formatNumber(job.total_queries)}`}
            />
            <Stat label="Địa điểm mới" value={formatNumber(job.new_places)} />
            <Stat label="Lỗi" value={formatNumber(job.failed_places)} />
            <Stat label="Bị chặn" value={formatNumber(job.blocked_count)} />
            <Stat
              label="Tốc độ"
              value={
                job.rate_per_min === null
                  ? "—"
                  : `${formatNumber(job.rate_per_min)} /phút`
              }
            />
            <Stat label="Bắt đầu" value={formatDateTime(job.started_at)} />
            <Stat label="Kết thúc" value={formatDateTime(job.finished_at)} />
            <Stat
              label="Kiểm tra website"
              value={job.params.enrich_website === false ? "Không" : "Có"}
            />
          </div>

          {job.last_error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {job.last_error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card size="sm" className="gap-0 py-0">
        <div className="border-b p-3">
          <p className="font-heading text-sm font-medium">
            Truy vấn con ({formatNumber(job.queries.length)})
          </p>
        </div>
        <JobQueriesTable queries={job.queries} />
      </Card>
    </div>
  );
}
