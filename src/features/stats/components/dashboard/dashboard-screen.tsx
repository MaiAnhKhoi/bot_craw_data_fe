"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { useOverview } from "@/features/stats/hooks/use-overview";
import { CompletenessCard } from "@/features/stats/components/dashboard/completeness-card";
import { DashboardSkeleton } from "@/features/stats/components/dashboard/dashboard-skeleton";
import { OverviewCards } from "@/features/stats/components/dashboard/overview-cards";
import { TopKeywordsCard } from "@/features/stats/components/dashboard/top-keywords-card";

/*
 * Màn Tổng quan.
 *
 * Hai biểu đồ nạp bằng next/dynamic với `ssr: false`: recharts là thư viện
 * NẶNG và chỉ có ích sau khi trang đã tương tác được, nên nó ra khỏi bundle
 * đầu; ô giữ chỗ cùng chiều cao 240px để biểu đồ hiện ra không đẩy layout.
 */
const DailyChart = dynamic(
  () =>
    import("@/features/stats/components/dashboard/daily-chart").then(
      (module) => module.DailyChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> },
);

const LivenessPie = dynamic(
  () =>
    import("@/features/stats/components/dashboard/liveness-pie").then(
      (module) => module.LivenessPie,
    ),
  { ssr: false, loading: () => <Skeleton className="h-[240px] w-full" /> },
);

export function DashboardScreen() {
  const { data, isPending, isError, error, refetch } = useOverview();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tổng quan"
        description="Tình hình dữ liệu lead thu thập được từ Google Maps."
      />

      {isPending ? <DashboardSkeleton /> : null}

      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data ? (
        <div className="space-y-4">
          <OverviewCards overview={data} />

          <div className="grid gap-3 lg:grid-cols-3">
            <Card size="sm" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Địa điểm mới 14 ngày gần nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyChart data={data.last_14_days} />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Tỉ lệ sống / chết</CardTitle>
              </CardHeader>
              <CardContent>
                <LivenessPie byLiveness={data.by_liveness} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <CompletenessCard overview={data} />
            <div className="lg:col-span-2">
              <TopKeywordsCard keywords={data.top_keywords} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
