import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber, percentValue } from "@/lib/format";
import type { Overview } from "@/features/stats/types/stats";

/*
 * Độ đầy đủ của 3 trường quan trọng nhất (SĐT, website, địa chỉ).
 * Backend trả SỐ DÒNG có dữ liệu, phần trăm do FE tính — đó là lý do mọi phép
 * chia đi qua `percentValue`, nó chặn sẵn trường hợp tổng bằng 0.
 */
export function CompletenessCard({ overview }: { overview: Overview }) {
  const rows = [
    { label: "Có số điện thoại", value: overview.completeness.phone },
    { label: "Có website", value: overview.completeness.website },
    { label: "Có địa chỉ", value: overview.completeness.address },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Độ đầy đủ dữ liệu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {rows.map((row) => {
          const percent = percentValue(row.value, overview.total);
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">
                  {percent}%
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({formatNumber(row.value)})
                  </span>
                </span>
              </div>
              <Progress value={percent} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
