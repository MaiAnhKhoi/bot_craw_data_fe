"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatNumber } from "@/lib/format";
import {
  LIVENESS_CHART_COLOR,
  LIVENESS_META,
  LIVENESS_ORDER,
} from "@/features/places/lib/liveness";
import type { Overview } from "@/features/stats/types/stats";

/*
 * Biểu đồ tròn tỉ lệ sống/chết. Cùng nhóm nạp động với daily-chart.
 * Nhãn và màu lấy từ bảng dùng chung của module Địa điểm để huy hiệu trong
 * bảng và lát bánh ở đây luôn cùng một màu — người đọc không phải học hai hệ.
 */
export function LivenessPie({
  byLiveness,
}: {
  byLiveness: Overview["by_liveness"];
}) {
  const rows = LIVENESS_ORDER.map((label) => ({
    key: label,
    name: LIVENESS_META[label].label,
    value: byLiveness[label],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={LIVENESS_CHART_COLOR[row.key]} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
          // Kiểu của recharts cho phép value/name là chuỗi hoặc mảng — ép kiểu ở đây.
          formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
