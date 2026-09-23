import Link from "next/link";
import { ROUTES } from "@/lib/constants";
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
import {
  JOB_QUERY_STATUS_META,
  STOP_REASON_META,
} from "@/features/jobs/lib/job-status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobQuery } from "@/features/jobs/types/job";

/*
 * Bảng các truy vấn con của một job (mỗi cặp từ khoá × địa điểm là một dòng).
 * Đây là nơi duy nhất nhìn ra job đang kẹt ở truy vấn nào và vì sao.
 */
export function JobQueriesTable({
  jobId,
  queries,
}: {
  jobId: number;
  queries: JobQuery[];
}) {
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
          <TableHead>Vì sao dừng</TableHead>
          <TableHead className="pr-4">Lỗi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => {
          const meta = JOB_QUERY_STATUS_META[query.status];
          // Truy vấn chưa chạy xong thì chưa có lý do dừng — để trống chứ
          // đừng hiện "Không rõ", hai thứ đó khác nhau.
          // Không có kết quả thì không có gì để mở — đừng dựng link dẫn tới
          // một bảng rỗng, người dùng sẽ tưởng bộ lọc hỏng.
          const coDiaDiem = (query.results_found ?? 0) > 0;
          const stop = query.stop_reason
            ? STOP_REASON_META[query.stop_reason]
            : null;
          return (
            <TableRow key={query.id}>
              {/*
                * Truy vấn dẫn thẳng sang ĐÚNG những địa điểm mà chính nó tìm ra.
                * Bảng này trước đây chỉ có tên truy vấn và con số — muốn xem địa
                * chỉ thì phải sang màn Địa điểm rồi tự lọc lại bằng tay, mà job
                * nhiều địa bàn thì không biết dòng nào của lượt nào.
                *
                * `keyword` chính là CẢ CHUỖI TRUY VẤN (backend lưu như vậy trong
                * place_keywords), nên một tham số là đủ tách chính xác.
                */}
              <TableCell className="max-w-80 pl-4 font-medium">
                {coDiaDiem ? (
                  <Link
                    href={`${ROUTES.places}?job_id=${jobId}&keyword=${encodeURIComponent(query.query)}`}
                    title={`Xem ${query.results_found} địa điểm của lượt tìm này`}
                    className="block truncate hover:underline"
                  >
                    {query.query}
                  </Link>
                ) : (
                  <span className="block truncate" title={query.query}>
                    {query.query}
                  </span>
                )}
              </TableCell>
              <TableCell className={cn("text-sm", meta.className)}>
                {meta.label}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(query.results_found)}
              </TableCell>
              <TableCell>
                {stop ? (
                  <Badge
                    variant="secondary"
                    className={cn("font-normal", stop.className)}
                    title={stop.hint}
                  >
                    {stop.label}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
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
