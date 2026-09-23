import { defineConfig } from "orval";

/*
 * Orval codegen — CHƯA dùng ở lần dựng đầu tiên (xem README §Đồng bộ Orval).
 * Backend chưa chạy lúc dựng FE nên lớp API hiện viết tay trong
 * `src/features/<module>/api/` theo đúng docs/API_CONTRACT.md.
 *
 * Khi backend đã chạy: `npm run api:sync` tải openapi.json về `openapi/` rồi
 * sinh model + hook TanStack Query vào `src/lib/api/generated` (KHÔNG sửa tay).
 * Mọi lời gọi sinh ra vẫn đi qua axios instance chung nhờ mutator, nên
 * interceptor JWT + bóc envelope giữ nguyên.
 */
export default defineConfig({
  botCrawData: {
    input: {
      target: "./openapi/api-docs.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/api/mutator.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          signal: true,
        },
      },
    },
  },
});
