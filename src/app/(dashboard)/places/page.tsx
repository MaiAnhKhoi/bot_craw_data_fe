import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { PlacesScreen } from "@/features/places/components/places/places-screen";

export const metadata: Metadata = { title: "Địa điểm" };

/*
 * Màn Địa điểm đọc bộ lọc ban đầu từ query string (`useSearchParams`), nên phải
 * nằm trong Suspense — nếu không, Next sẽ từ chối prerender cả route.
 */
export default function PlacesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PlacesScreen />
    </Suspense>
  );
}
