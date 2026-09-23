"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, formatShortDate } from "@/lib/format";
import type { Overview } from "@/features/stats/types/stats";

/*
 * Biểu đồ cột: số địa điểm mới thu được trong 14 ngày gần nhất.
 *
 * File này là điểm NẠP ĐỘNG của recharts — dashboard-screen import nó bằng
 * next/dynamic nên toàn bộ thư viện biểu đồ (nặng) không nằm trong bundle đầu
 * của app; màn Jobs và Địa điểm không phải tải một dòng nào của recharts.
 */
export function DailyChart({ data }: { data: Overview["last_14_days"] }) {
  const rows = data.map((row) => ({
    label: formatShortDate(row.date),
    count: row.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          stroke="var(--muted-foreground)"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={48}
          stroke="var(--muted-foreground)"
          tickFormatter={(value: number) => formatNumber(value)}
        />
        <RechartsTooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
          // Kiểu của recharts cho phép value là chuỗi/mảng, nên ép số ở đây.
          formatter={(value) => [formatNumber(Number(value)), "Địa điểm mới"]}
        />
        <Bar
          dataKey="count"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          // Tắt hiệu ứng vẽ dần: biểu đồ này nằm ngay đầu màn, animation chỉ
          // làm chậm thời điểm người dùng đọc được số (Rule 1).
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
