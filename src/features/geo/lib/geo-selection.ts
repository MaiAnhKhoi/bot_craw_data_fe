import type { ExpandRequest } from "@/features/geo/types";

/*
 * Quy ước mã đặc biệt + các phép tính THUẦN của bộ chọn địa giới.
 * Không React, không API — để component chỉ còn việc hiển thị và test được bằng mắt.
 */

/** Mã backend hiểu là "tách ra từng mục ở cấp này". */
export const GEO_ALL = "ALL";

/**
 * Mã CHỈ tồn tại ở frontend: "bỏ qua cấp này" (dừng ở cấp trên).
 * Cần một chuỗi riêng thay vì `null` để combobox còn hiện được chữ cho người dùng
 * đọc; lúc gửi đi `buildExpandRequest` đổi nó thành `null`.
 */
export const GEO_SKIP = "__SKIP__";

/*
 * Nhịp mặc định của worker: mỗi truy vấn tốn khoảng 20 giây cho phần TÌM KIẾM,
 * chưa kể thời gian mở từng trang chi tiết. Ước lượng dưới đây vì thế là cận
 * DƯỚI — cố tình, để người dùng không bị hụt hẫng khi job chạy lâu hơn.
 */
export const SECONDS_PER_QUERY = 20;

/** Trên ngưỡng này thì hiện cảnh báo hổ phách kèm ước lượng thời gian. */
export const LOCATION_WARNING_THRESHOLD = 200;

/** Lựa chọn 4 cấp đang hiển thị trên giao diện. */
export interface GeoSelection {
  /** Mã châu lục hoặc `GEO_ALL`. CHỈ lọc danh sách quốc gia. */
  continent: string;
  /** Mã quốc gia, `GEO_ALL`, hoặc `null` khi người dùng chưa chọn gì. */
  country: string | null;
  /** Mã tỉnh, `GEO_ALL`, hoặc `GEO_SKIP`. */
  province: string;
  /** Mã phường/xã, `GEO_ALL`, hoặc `GEO_SKIP`. */
  ward: string;
}

export const EMPTY_SELECTION: GeoSelection = {
  continent: GEO_ALL,
  country: null,
  province: GEO_SKIP,
  ward: GEO_SKIP,
};

/*
 * Đổi lựa chọn trên màn hình thành thân của POST /geo/expand.
 *
 * Trả `null` khi chưa chọn quốc gia — lúc đó không gọi API, vì "chưa chọn gì"
 * không phải là một yêu cầu xem trước.
 *
 * Hai chỗ dễ sai được xử ở đây một lần cho xong:
 *  - Châu lục = "Tất cả" thì gửi `null` (nó chỉ là bộ lọc của ô quốc gia).
 *  - Bỏ qua cấp tỉnh thì cấp phường/xã cũng phải bỏ, nếu không backend sẽ
 *    nhận một lựa chọn vô nghĩa (chọn phường mà không có tỉnh).
 */
export function buildExpandRequest(
  selection: GeoSelection,
): ExpandRequest | null {
  if (!selection.country) return null;

  const province =
    selection.province === GEO_SKIP ? null : selection.province;
  const ward =
    province === null || selection.ward === GEO_SKIP ? null : selection.ward;

  return {
    continent: selection.continent === GEO_ALL ? null : selection.continent,
    country: selection.country,
    province,
    ward,
  };
}

const COMBINING_MARK_START = 0x300;
const COMBINING_MARK_END = 0x36f;

/*
 * Bỏ dấu + thường hoá để gõ "ho chi" vẫn ra "Thành phố Hồ Chí Minh".
 *
 * Bộ lọc mặc định của Base UI dùng `Intl.Collator` với `sensitivity: "base"`;
 * với tiếng Việt, ă/â/ê/ô/ơ/ư là CHỮ CÁI GỐC KHÁC nhau nên cách đó không chắc
 * khớp khi gõ không dấu, lại còn phụ thuộc locale của trình duyệt. Tự gấp dấu ở
 * đây cho kết quả giống hệt bộ lọc `q` của backend, không phụ thuộc máy người dùng.
 *
 * Viết bằng vòng lặp mã ký tự thay vì regex dải Unicode để file nguồn không chứa
 * ký tự dấu vô hình.
 */
export function foldText(value: string): string {
  const decomposed = value.normalize("NFD").toLowerCase();
  let folded = "";
  for (const char of decomposed) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= COMBINING_MARK_START && code <= COMBINING_MARK_END) continue;
    folded += char === "đ" ? "d" : char;
  }
  return folded;
}

/** Số truy vấn Google Maps mà lựa chọn này sẽ sinh ra. */
export function estimateQueryCount(
  locationCount: number,
  keywordCount: number,
): number {
  return locationCount * Math.max(keywordCount, 1);
}

function formatDecimal(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** Đổi số giây thành chuỗi người đọc được: "40 phút", "3,5 giờ", "2,1 ngày". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} phút`;
  const hours = minutes / 60;
  if (hours < 24) return `${formatDecimal(hours)} giờ`;
  return `${formatDecimal(hours / 24)} ngày`;
}
