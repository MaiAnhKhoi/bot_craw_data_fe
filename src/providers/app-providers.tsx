"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { makeQueryClient } from "@/lib/query-client";
import { SessionProvider } from "@/providers/session-provider";

/*
 * Provider cấp app, gắn đúng một lần ở root layout:
 * TanStack Query (server state) → SessionProvider (nạp token từ localStorage)
 * → TooltipProvider (bảng Địa điểm dùng tooltip ở từng dòng) → Toaster.
 *
 * QueryClient tạo trong useState để mỗi phiên trình duyệt có đúng một client
 * (an toàn với React strict mode và streaming RSC).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SessionProvider>
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
