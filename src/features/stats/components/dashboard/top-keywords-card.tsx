import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ROUTES } from "@/lib/constants";
import type { Overview } from "@/features/stats/types/stats";

/*
 * Bảng từ khoá cho nhiều lead nhất. Mỗi dòng dẫn thẳng sang màn Địa điểm đã
 * lọc sẵn theo từ khoá đó — đường tắt của thao tác hay làm nhất: "từ khoá này
 * ra nhiều, xem danh sách ngay".
 */
export function TopKeywordsCard({
  keywords,
}: {
  keywords: Overview["top_keywords"];
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Từ khoá nhiều kết quả nhất</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {keywords.length === 0 ? (
          <EmptyState
            title="Chưa có từ khoá nào"
            description="Tạo job quét đầu tiên để bắt đầu thu thập dữ liệu."
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Từ khoá</TableHead>
                <TableHead className="pr-4 text-right">Số địa điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((row) => (
                <TableRow key={row.keyword}>
                  <TableCell className="pl-4">
                    <Link
                      href={`${ROUTES.places}?keyword=${encodeURIComponent(row.keyword)}`}
                      className="font-medium hover:underline"
                    >
                      {row.keyword}
                    </Link>
                  </TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">
                    {formatNumber(row.count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
