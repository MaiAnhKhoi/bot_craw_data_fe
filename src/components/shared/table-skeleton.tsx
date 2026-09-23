import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/*
 * Skeleton KHỚP LAYOUT của bảng thật: cùng số cột, cùng chiều cao dòng, cùng
 * khoảng đệm — dữ liệu về thì không nhảy layout. Đây là lý do nó nhận `columns`
 * (nhãn cột thật) chứ không vẽ đại mấy ô xám.
 */
export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: string[];
  rows?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell key={column} className="h-[45px]">
                <Skeleton className="h-4 w-full max-w-40" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
