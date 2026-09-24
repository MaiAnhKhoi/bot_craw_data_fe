import Link from "next/link";
import { MapPinOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ROUTES } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STOP_REASON_META } from "@/features/jobs/lib/job-status";
import { placesHrefForQuery } from "@/features/remaining-areas/lib/remaining-areas";
import type { RemainingArea } from "@/features/remaining-areas/types/remaining-area";

/* Nhãn cột — khai một chỗ để skeleton dùng lại đúng bộ cột của bảng thật. */
export const REMAINING_AREA_COLUMNS = [
  "Chọn",
  "Địa bàn",
  "Vì sao dừng",
  "Kết quả",
  "Quét lúc",
  "Job gần nhất",
];

/*
 * Bảng địa bàn còn sót. Mỗi dòng là MỘT chuỗi truy vấn, đã gộp qua mọi job và
 * chỉ giữ lần quét gần nhất — nên không bao giờ có hai dòng cùng địa bàn.
 *
 * Hai lối đi ra khỏi mỗi dòng, vì đó là toàn bộ công dụng của trang này:
 * tên địa bàn dẫn sang ĐÚNG những địa điểm lượt tìm đó đã lấy được, còn cột
 * job dẫn về lần chạy đã sinh ra con số này.
 *
 * Bảng KHÔNG tự bọc thêm vùng cuộn ngang: component Table đã có sẵn một cái.
 * Bọc thêm là sinh ra hai thanh cuộn chồng nhau, trên điện thoại thì gần như
 * không cách nào kéo trúng cái mình muốn.
 *
 * Ô chọn nhận diện dòng bằng CHUỖI TRUY VẤN chứ không phải `job_id`: mỗi chuỗi
 * chỉ ra đúng một dòng (backend đã gộp qua mọi job), và chuỗi cũng chính là thứ
 * gửi lên khi tạo job chia nhỏ. Dùng `job_id` thì chọn xong đổi trang là mất
 * dấu, vì cùng một địa bàn có thể đổi job gần nhất giữa hai lần tải.
 */
export function RemainingAreasTable({
  areas,
  selected,
  onToggle,
  onToggleAll,
}: {
  areas: RemainingArea[];
  selected: ReadonlySet<string>;
  onToggle: (query: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const daChonHet = areas.length > 0 && areas.every((a) => selected.has(a.query));

  if (areas.length === 0) {
    return (
      <EmptyState
        icon={<MapPinOffIcon className="size-5" />}
        title="Không có địa bàn nào còn sót"
        description="Mọi truy vấn đã quét đều được Google trả hết danh sách. Quét thêm địa bàn mới hoặc đổi bộ lọc lý do dừng."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pl-4">
            {/*
              * Ô chọn ở tiêu đề chỉ nhận trang ĐANG XEM. Không gom cả 200 dòng
              * ở mọi trang: một cú bấm mà đặt lệnh chạy nhiều ngày thì phải là
              * việc cố ý, không phải việc vô tình.
              */}
            <Checkbox
              checked={daChonHet}
              onCheckedChange={(checked) => onToggleAll(checked === true)}
              aria-label="Chọn mọi địa bàn trong trang này"
            />
          </TableHead>
          {REMAINING_AREA_COLUMNS.slice(1).map((column) => (
            <TableHead key={column} className="last:pr-4">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map((area) => {
          const stop = STOP_REASON_META[area.stop_reason];
          /*
           * Không có kết quả thì không có gì để mở — đừng dựng link dẫn tới một
           * bảng rỗng, người dùng sẽ tưởng bộ lọc hỏng. Hay gặp nhất là các
           * dòng "Không rõ": danh sách kết quả còn chẳng hiện ra.
           */
          const coDiaDiem = (area.results_found ?? 0) > 0;
          /*
           * `data-state="selected"` là móc có sẵn của TableRow — dòng đang chọn
           * tự tô nền, không phải bịa thêm class nào.
           */
          return (
            <TableRow
              key={area.query}
              data-state={selected.has(area.query) ? "selected" : undefined}
            >
              <TableCell className="w-10 pl-4">
                <Checkbox
                  checked={selected.has(area.query)}
                  onCheckedChange={(checked) =>
                    onToggle(area.query, checked === true)
                  }
                  aria-label={`Chọn ${area.query}`}
                />
              </TableCell>
              {/*
                * `block truncate` là bắt buộc: TableCell mang sẵn
                * `whitespace-nowrap`, `max-w-*` một mình chỉ giới hạn bề rộng ô
                * chứ không cắt chữ — tên địa bàn dài sẽ vẽ đè lên cột bên cạnh.
                */}
              <TableCell className="max-w-72 font-medium">
                {coDiaDiem ? (
                  <Link
                    href={placesHrefForQuery(area.job_id, area.query)}
                    title={`Xem ${area.results_found} địa điểm lượt tìm này đã lấy được`}
                    className="block truncate hover:underline"
                  >
                    {area.query}
                  </Link>
                ) : (
                  <span className="block truncate" title={area.query}>
                    {area.query}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("font-normal", stop.className)}
                  title={stop.hint}
                >
                  {stop.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(area.results_found)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(area.finished_at)}
              </TableCell>
              <TableCell className="max-w-56 pr-4">
                <Link
                  href={ROUTES.jobDetail(area.job_id)}
                  title={`Mở job "${area.job_name}"`}
                  className="block truncate text-sm hover:underline"
                >
                  {area.job_name}
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
