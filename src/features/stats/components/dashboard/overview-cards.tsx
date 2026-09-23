import {
  CircleCheckIcon,
  CircleHelpIcon,
  CircleSlashIcon,
  DatabaseIcon,
  SparklesIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Overview } from "@/features/stats/types/stats";

/*
 * Dải thẻ số liệu đầu màn Tổng quan.
 * Server Component — chỉ nhận dữ liệu qua prop và render, không hook, không
 * tương tác, nên không cần "use client" (Rule 1: bớt JS gửi xuống trình duyệt).
 */

function StatCard({
  icon,
  label,
  value,
  hint,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accentClass?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            accentClass,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-xl font-semibold tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewCards({ overview }: { overview: Overview }) {
  const { total, by_liveness: liveness } = overview;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard
        icon={<DatabaseIcon className="size-4.5" />}
        label="Tổng địa điểm"
        value={formatNumber(total)}
        hint={`${formatNumber(overview.done)} đã quét xong`}
      />
      <StatCard
        icon={<SparklesIcon className="size-4.5" />}
        label="Mới hôm nay"
        value={formatNumber(overview.today_new)}
        hint={`${formatNumber(overview.pending)} đang chờ quét`}
        accentClass="bg-primary/10 text-primary"
      />
      <StatCard
        icon={<CircleCheckIcon className="size-4.5" />}
        label="Còn hoạt động"
        value={formatNumber(liveness.ACTIVE)}
        hint={formatPercent(liveness.ACTIVE, total)}
        accentClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      />
      <StatCard
        icon={<CircleHelpIcon className="size-4.5" />}
        label="Nghi ngờ"
        value={formatNumber(liveness.SUSPECT)}
        hint={formatPercent(liveness.SUSPECT, total)}
        accentClass="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      />
      <StatCard
        icon={<CircleSlashIcon className="size-4.5" />}
        label="Đã chết"
        value={formatNumber(liveness.DEAD)}
        hint={formatPercent(liveness.DEAD, total)}
        accentClass="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      />
    </div>
  );
}
