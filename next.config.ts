import type { NextConfig } from "next";

/*
 * Cấu hình Next cho bot_craw_data_fe.
 *
 * 1) `output: "standalone"` — build ra `.next/standalone/server.js` để Dockerfile
 *    multi-stage chỉ cần copy đúng phần runtime, image gọn và chạy bằng
 *    `node server.js` (xem Dockerfile).
 *
 * 2) Rewrite `/api/*` → backend FastAPI. Trình duyệt luôn gọi SAME-ORIGIN
 *    (`/api/v1/...`) nên không bao giờ dính CORS, và EventSource của màn chi tiết
 *    job (SSE) cũng đi qua đây — endpoint SSE chỉ nhận token qua query param khi
 *    cùng origin (xem docs/API_CONTRACT.md §2).
 *    Đổi backend bằng biến môi trường `API_BASE_URL` (biến SERVER, không lộ ra
 *    client) — không hardcode URL trong code feature.
 */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
