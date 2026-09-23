# bot_craw_data_fe

Frontend của **bot_craw_data** — công cụ NỘI BỘ quét Google Maps để thu thập lead
doanh nghiệp: **tên công ty · vị trí · số điện thoại · website**, kèm chấm điểm
sống/chết để lọc bỏ những nơi đã ngừng hoạt động.

Backend (FastAPI) nằm ở repo riêng `ago_bot_craw_data`. Hợp đồng giữa hai bên là
`docs/API_CONTRACT.md` của repo đó — **đó là nguồn chuẩn duy nhất**, đổi contract
thì sửa file đó trước, sửa code sau.

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- TanStack Query (server state) · TanStack Table + Virtual (bảng) · Axios
- Zustand (client state) · React Hook Form + Zod (form) · Recharts (biểu đồ)
- Giao diện: **tiếng Việt toàn bộ**

## Chạy ở máy dev

```bash
npm install
cp .env.example .env.local     # rồi sửa API_BASE_URL nếu backend không ở cổng 8000
npm run dev                    # http://localhost:3000
```

Kiểm tra trước khi báo xong (cả ba phải xanh):

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8000` | URL backend FastAPI. Biến **server** — chỉ Next dùng để rewrite `/api/*`, không lộ ra trình duyệt. |

Trình duyệt **luôn** gọi same-origin `/api/v1/...`; `next.config.ts` rewrite sang
backend. Nhờ vậy không bao giờ dính CORS, và `EventSource` (SSE tiến độ job) đi
qua cùng một origin nên backend chấp nhận token ở query param.

## Chạy bằng Docker

```bash
docker build -t bot-craw-data-fe .
docker run --rm -p 3000:3000 -e API_BASE_URL=http://host.docker.internal:8000 bot-craw-data-fe
```

Image dựng theo 3 tầng (`deps` → `builder` → `runner`), chạy `node server.js` từ
output `standalone` của Next, bằng user thường (`nextjs`, uid 1001).

## Cấu trúc thư mục

```text
src/
  app/
    (auth)/login/            màn đăng nhập (không có khung app)
    (dashboard)/             khung app: sidebar + header + AuthGuard
      page.tsx               Tổng quan
      jobs/                  danh sách job
      jobs/[id]/             chi tiết job (SSE)
      places/                bảng địa điểm
  components/
    ui/                      primitive (copy từ ago_frontend, base-ui + cva)
    layout/                  sidebar, header, nav, AuthGuard
    shared/                  dùng chung >= 2 feature (PageHeader, EmptyState...)
  features/
    auth/   jobs/   places/   stats/
      api/        gọi backend (nơi DUY NHẤT chạm axios)
      hooks/      TanStack Query hook (useXxx)
      components/ chia theo nghiệp vụ con, vd components/places/
      schemas/    Zod schema của form
      types/      DTO khớp contract
      lib/        bảng dịch/hằng số riêng của feature (liveness, job-status)
  lib/            api.ts · constants.ts · format.ts · query-client.ts · utils.ts
  hooks/          hook dùng chung toàn app (use-debounced-value)
  providers/      AppProviders, SessionProvider
  stores/         auth-store (zustand)
  types/          kiểu dùng chung (envelope, Page, JobPhase)
```

## Quy ước code (tóm tắt Rule 0 và Rule 1 của AGENTS.md)

**Rule 0 — feature-first, không có ngoại lệ.** Biết code nằm ở đâu TRƯỚC khi viết:

| Muốn thêm... | Đặt vào |
|---|---|
| Route mới | `app/(dashboard)/<resource>/page.tsx` — chỉ render component từ features |
| Component nghiệp vụ | `features/<module>/components/<nghiệp-vụ-con>/` |
| Gọi API | `features/<module>/api/` (qua `lib/api.ts`) + hook trong `hooks/` |
| Form + validation | Zod schema trong `features/<module>/schemas/` + RHF trong component |
| Kiểu DTO | `features/<module>/types/` |
| Dùng chung ≥ 2 feature | `components/shared/`, `lib/`, `src/types/` |
| Đường dẫn route, hằng số | `lib/constants.ts` — không hardcode path trong component |

Luồng phụ thuộc MỘT CHIỀU: `component → hook → api → axios`. Component không
biết axios tồn tại; đổi giao diện không được chạm tầng API.

**Rule 1 — tốc độ trước, đẹp sau.** Màn hình mở hàng trăm lần mỗi ngày:

- Phân trang/lọc/sắp xếp **luôn ở server** — không bao giờ tải hết rồi lọc client.
- Giữ dữ liệu cũ khi refetch (`placeholderData: keepPreviousData`) thay vì nháy skeleton.
- Ảo hoá bảng khi một trang > 100 dòng (`@tanstack/react-virtual`).
- Server Component mặc định; `"use client"` chỉ ở nơi cần tương tác.
- Recharts nạp bằng `next/dynamic` — không nằm trong bundle đầu.
- Icon import lẻ từ `lucide-react`, không import cả gói.
- `staleTime` hợp lý (stats 30s, places 10s); **không polling** — tiến độ job đã có SSE.
- Không subscribe cả store: `useStore((s) => s.field)`.
- Hiệu ứng chỉ bằng CSS và tôn trọng `prefers-reduced-motion`.

Skeleton phải **khớp layout thật** (cùng cột, cùng chiều cao dòng) để dữ liệu về
không làm nhảy bố cục. Mọi màn có dữ liệu đều phải có trạng thái rỗng và trạng
thái lỗi tử tế — không bao giờ nuốt lỗi thành "chưa có dữ liệu".

## Tiến độ job theo thời gian thực (SSE)

Màn `/jobs/[id]` mở `EventSource` tới `GET /api/v1/jobs/{id}/events?token=...`
trong hook `useJobEvents(id)`:

- gói `event: progress` được **vá vào cache** của `useJob(id)` — không có state
  song song, nên mọi phần trên màn cập nhật cùng lúc;
- `event: done` → đóng hẳn kết nối, rồi nạp lại bản đầy đủ (thời gian kết thúc,
  trạng thái từng truy vấn con);
- mất kết nối → tự thử lại với backoff luỹ thừa, tối đa 30 giây một lần;
- rời màn → huỷ timer đang chờ và đóng `EventSource`.

## Xuất Excel/CSV

Nút "Xuất file" tạo thẻ `<a download>` trỏ tới `GET /api/v1/places/export?...`
kèm **đúng bộ lọc đang chọn** — cố ý KHÔNG fetch blob, vì file tới 100.000 dòng
mà kéo hết vào RAM là cách chắc chắn nhất làm treo tab.

> **Cần backend xác nhận:** thẻ `<a>` không gắn được header `Authorization`, nên
> token đi kèm ở query param giống endpoint SSE. Nếu backend chỉ chấp nhận token
> ở header cho endpoint này, phương án sạch hơn là cấp một *signed URL* dùng một
> lần; khi đó chỉ cần sửa `placesExportUrl` trong `features/places/api/places-api.ts`.

## Đồng bộ Orval (làm sau)

Lần dựng đầu này **lớp API viết tay** trong `features/<module>/api/` theo đúng
`docs/API_CONTRACT.md`, vì backend chưa chạy lúc dựng frontend nên không tải được
OpenAPI spec.

Khi backend đã lên:

```bash
npm run api:sync     # = api:spec (tải openapi.json) + api:gen (sinh code)
```

- `openapi/api-docs.json` — spec tải về, **commit** cùng code sinh ra.
- `src/lib/api/generated/**` — build artifact, **cấm sửa tay** (đã eslint-ignore,
  regenerate với `clean: true`).
- Code sinh ra vẫn đi qua axios instance chung nhờ `src/lib/api/mutator.ts`, nên
  interceptor JWT, bóc envelope và xử lý 401 giữ nguyên.
- Component **không** import thẳng hook từ `generated/`; mỗi feature bọc lại
  trong `features/<module>/hooks/` — một chỗ duy nhất đặt `staleTime`, `enabled`…

## CI

`.github/workflows/ci.yml` chạy trên push/PR vào `main`:

1. `build` — checkout, Node 22 + cache npm, `npm ci`, `npm run lint`, `npm run build`.
2. `docker` — `docker build` để chắc chắn image dựng được (**không push**).
