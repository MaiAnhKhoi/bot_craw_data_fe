import type { VisibilityState } from "@tanstack/react-table";

/*
 * Ánh xạ CỘT CỦA BẢNG -> CỘT CỦA FILE XUẤT.
 *
 * VÌ SAO PHẢI CÓ BẢNG ÁNH XẠ, KHÔNG GỬI THẲNG ID CỘT CỦA BẢNG LÊN SERVER:
 * bảng trên màn hình và file xuất là HAI TẬP CỘT KHÁC NHAU, phục vụ hai việc
 * khác nhau.
 *   - Bảng có ~10 cột, để NHÌN: mỗi ô gộp nhiều mẩu thông tin vào một chỗ
 *     (ô "Vị trí" vừa là địa chỉ vừa là dấu "chưa đầy đủ"; ô "Tình trạng" vừa
 *     là nhãn sống/chết vừa là điểm số).
 *   - File có 23 cột, để LÀM VIỆC trên Excel: mỗi mẩu tách thành một cột riêng
 *     thì mới lọc/sắp/dựng công thức được.
 * Gửi thẳng id của bảng thì server nhận toàn khoá lạ — theo hợp đồng API khoá
 * lạ bị bỏ qua, không còn khoá hợp lệ nào thì server xuất đủ 23 cột. Tức là
 * giao diện im lặng KHÔNG LÀM GÌ CẢ mà người dùng vẫn tưởng đã lọc cột.
 *
 * Thứ tự cột trong file LUÔN theo `EXPORT_COLUMN_KEYS` (server quyết), không
 * theo thứ tự người dùng bật/tắt — đừng cố sắp xếp lại ở đây.
 */

/*
 * 23 khoá cột của file xuất, ĐÚNG thứ tự server ghi ra file
 * (backend: app/modules/scraper/place/export.py, hằng `COLUMNS`).
 */
export const EXPORT_COLUMN_KEYS = [
  "name",
  "location",
  "address_full",
  "country",
  "country_source",
  "phone",
  "website",
  "liveness",
  "contact",
  "contact_note",
  "liveness_score",
  "liveness_reasons",
  "category",
  "rating",
  "review_count",
  "latest_review_days",
  "website_status",
  "phone_e164",
  "lat",
  "lng",
  "keywords",
  "maps_url",
  "scraped_at",
] as const;

export type ExportColumnKey = (typeof EXPORT_COLUMN_KEYS)[number];

/** Tổng số cột của file khi xuất đủ — hiện trong nhãn "Xuất N/23 cột". */
export const EXPORT_COLUMN_COUNT = EXPORT_COLUMN_KEYS.length;

/*
 * Nhãn tiếng Việt của từng cột file xuất, khớp từng chữ với tiêu đề server ghi
 * vào file. Dùng để liệt kê ra những cột SẼ BỊ BỎ: con số "16/23" nói được là
 * mất bao nhiêu, nhưng chỉ tên cột mới nói được mất CÁI GÌ.
 */
export const EXPORT_COLUMN_LABELS: Record<ExportColumnKey, string> = {
  name: "Tên công ty",
  location: "Vị trí",
  address_full: "Địa chỉ đầy đủ?",
  country: "Quốc gia",
  country_source: "Nguồn quốc gia",
  phone: "Số điện thoại",
  website: "Website",
  liveness: "Tình trạng",
  contact: "Chăm sóc",
  contact_note: "Ghi chú chăm sóc",
  liveness_score: "Điểm tình trạng",
  liveness_reasons: "Lý do nghi ngờ",
  category: "Ngành nghề",
  rating: "Điểm đánh giá",
  review_count: "Số đánh giá",
  latest_review_days: "Đánh giá mới nhất (ngày)",
  website_status: "Tình trạng website",
  phone_e164: "SĐT chuẩn E.164",
  lat: "Vĩ độ",
  lng: "Kinh độ",
  keywords: "Từ khoá tìm ra",
  maps_url: "Link Google Maps",
  scraped_at: "Thời điểm quét",
};

/*
 * Một cột của bảng kéo theo những cột nào của file.
 *
 * QUY TẮC ĐÃ CHỌN — chỉ ánh xạ thứ NHÌN THẤY ĐƯỢC ngay trong ô:
 * người dùng bật "chỉ xuất các cột đang hiện" là để lấy về đúng thứ họ đang
 * nhìn. Cái gì phải rê chuột (tooltip), phải bấm (nút sao chép) hay nằm trong
 * `href` mới thấy thì KHÔNG tính là "đang hiện" — nó không phải thứ người dùng
 * đọc được khi quét mắt qua bảng.
 *
 * Nhờ quy tắc này mà một cột bảng có thể kéo theo nhiều cột file: ô "Tình
 * trạng" in ra cả nhãn lẫn điểm số, nên tắt nó đi là mất cả hai.
 *
 * Khoá của bảng này là `id` trong `placeColumns` (place-columns.tsx). Thêm cột
 * mới cho bảng mà quên khai ở đây thì cột đó đơn giản là không kéo theo cột file
 * nào — im lặng nhưng không sai lệch dữ liệu.
 */
export const TABLE_TO_EXPORT_COLUMNS: Record<
  string,
  readonly ExportColumnKey[]
> = {
  name: ["name"],
  /* Ô "Vị trí" in kèm nhãn "(chưa đầy đủ)" — đúng là cột `address_full`. */
  address: ["location", "address_full"],
  /* Chấm hổ phách "quốc gia chỉ là phỏng đoán" chính là `country_source`. */
  country: ["country", "country_source"],
  /*
   * KHÔNG kéo theo `phone_e164`: dạng E.164 chỉ nằm trong `tel:` và nút sao
   * chép, bảng không in nó ra bao giờ. Ai cần dạng chuẩn thì xuất đủ cột.
   */
  phone: ["phone"],
  /* Huy hiệu "Không có website / Hỏng / Trang đỗ" là cột `website_status`. */
  website: ["website", "website_status"],
  /*
   * `liveness_score` đi kèm vì con số nằm ngay trong huy hiệu. `liveness_reasons`
   * thì KHÔNG: lý do chỉ hiện khi rê chuột, và trong file nó là một cột chữ dài
   * ("Không có website; Rất ít đánh giá; ...") — người bật chế độ này đang muốn
   * một file gọn, không muốn cột đó.
   */
  liveness: ["liveness", "liveness_score"],
  /* Icon ghi chú đổi hình khi dòng có ghi chú, nên ghi chú tính là đang hiện. */
  contact: ["contact", "contact_note"],
  category: ["category"],
  rating: ["rating"],
  review_count: ["review_count"],
  /*
   * Cột "Hành động" CỐ Ý không kéo theo cột nào. Nó không tắt được
   * (`enableHiding: false`), nên nếu gán `maps_url` vào đây thì link Maps sẽ có
   * mặt trong MỌI file "gọn" — trái hẳn mục đích của chế độ này. Cần link Maps
   * thì tắt chế độ đi và xuất đủ cột.
   */
  actions: [],
};

/*
 * 8 cột của file KHÔNG có chỗ nào trên bảng, nên bật chế độ "chỉ cột đang hiện"
 * là còn 15/23 cột: `liveness_reasons`, `latest_review_days`, `phone_e164`,
 * `lat`, `lng`, `keywords`, `maps_url`, `scraped_at`.
 *
 * Chúng bị LOẠI khi bật "chỉ xuất các cột đang hiện" — không có cách nào để
 * người dùng bật/tắt chúng trên bảng, nên gắn chúng vào một cột bất kỳ là quyết
 * định thay người dùng. Và đó cũng là điều họ muốn: bật chế độ này chính là để
 * có file gọn đem đi gọi, không phải file đủ toạ độ với dấu thời gian.
 *
 * Con số "N/23" hiện ở giao diện đã tính cả phần bị loại này, nên người dùng
 * thấy đúng thực tế trước khi bấm, không bị hụt cột sau khi mở file.
 */

/**
 * Danh sách khoá cột sẽ gửi lên `/places/export` cho đúng những cột bảng đang
 * hiện. Trả về theo THỨ TỰ CHUẨN của file, và có thể RỖNG (người dùng tắt hết
 * cột) — chỗ gọi phải tự xử ca rỗng chứ đừng gửi lên, vì server hiểu "không
 * khoá hợp lệ nào" là "xuất đủ 23 cột".
 */
export function exportColumnsForVisibility(
  visibility: VisibilityState,
): ExportColumnKey[] {
  const dangHien = new Set<ExportColumnKey>();
  for (const [columnId, exportKeys] of Object.entries(
    TABLE_TO_EXPORT_COLUMNS,
  )) {
    /*
     * `undefined` nghĩa là ĐANG HIỆN — giống hệt quy ước của TanStack Table và
     * của `ColumnVisibilityMenu`. Dùng `!visibility[id]` ở đây là sai: cột chưa
     * ai đụng tới sẽ bị coi như đã tắt.
     */
    if (visibility[columnId] === false) continue;
    for (const key of exportKeys) dangHien.add(key);
  }
  return EXPORT_COLUMN_KEYS.filter((key) => dangHien.has(key));
}

/** Nhãn của những cột sẽ KHÔNG có trong file, theo thứ tự chuẩn. */
export function exportColumnsDropped(kept: readonly ExportColumnKey[]): string[] {
  const giuLai = new Set<ExportColumnKey>(kept);
  return EXPORT_COLUMN_KEYS.filter((key) => !giuLai.has(key)).map(
    (key) => EXPORT_COLUMN_LABELS[key],
  );
}
