import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber } from "@/lib/format";
import { JOB_QUERY_STATUS_META } from "@/features/jobs/lib/job-status";
import { cn } from "@/lib/utils";
import type { JobQuery } from "@/features/jobs/types/job";

/*
 * Bảng các truy vấn con của một job (mỗi cặp từ khoá × địa điểm là một dòng).
 * Đây là nơi duy nhất nhìn ra job đang kẹt ở truy vấn nào và vì sao.
 */
export function JobQueriesTable({ queries }: { queries: JobQuery[] }) {
  if (queries.length === 0) {
    return (
      <EmptyState
        title="Chưa có truy vấn nào"
        description="Job vừa được tạo, worker sẽ sinh danh sách truy vấn khi bắt đầu chạy."
        className="py-8"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Truy vấn</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Kết quả</TableHead>
          <TableHead className="pr-4">Lỗi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => {
          const meta = JOB_QUERY_STATUS_META[query.status];
          return (
            <TableRow key={query.id}>
              <TableCell className="max-w-80 truncate pl-4 font-medium">
                {query.query}
              </TableCell>
              <TableCell className={cn("text-sm", meta.className)}>
                {meta.label}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(query.results_found)}
              </TableCell>
              <TableCell className="max-w-64 truncate pr-4 text-xs text-destructive">
                {query.error ?? ""}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
