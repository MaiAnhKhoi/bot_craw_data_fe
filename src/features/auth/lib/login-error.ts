import { ApiError, errorMessage } from "@/lib/api";

/*
 * Phân loại lý do bị từ chối khi đăng nhập.
 *
 * VÌ SAO KHÔNG GỘP LÀM MỘT RỔ "Đăng nhập thất bại": hệ thống sắp mở ra Internet
 * qua Cloudflare Tunnel nên backend phải tạm khoá sau một loạt lần nhập sai —
 * không có giới hạn thì dò được 20 lần/giây, mà mật khẩu kiểu `sale2026` nằm
 * trong vài nghìn cái phổ biến đầu tiên, tức là rụng trong dưới 5 phút.
 *
 * Hệ quả cho giao diện: từ nay có một ca mà NGƯỜI DÙNG GÕ ĐÚNG MẬT KHẨU vẫn bị
 * từ chối. Báo cho họ đúng câu "sai tên đăng nhập hoặc mật khẩu" là đẩy họ vào
 * việc gõ lại mãi — mỗi lần gõ lại là một lần bị đếm, khoá càng kéo dài. Đây là
 * lý do 429 phải tách hẳn khỏi 401 và phải hiện NGUYÊN VĂN câu của backend: chỉ
 * backend mới biết còn bao nhiêu phút.
 */

export type LoginErrorKind = "locked" | "credentials" | "other";

export interface LoginErrorInfo {
  kind: LoginErrorKind;
  /** Câu chính — ưu tiên nguyên văn của backend. */
  message: string;
  /** Dặn thêm: phải làm gì tiếp, và đừng làm gì. */
  hint?: string;
}

/*
 * Câu của backend, hoặc `null` khi thứ trả về không phải do nó viết.
 *
 * 429 có thể đến từ backend (khoá tài khoản, hoặc chặn theo địa chỉ IP khi
 * nhiều tài khoản bị dò từ cùng một chỗ), mà cũng có thể đến từ lớp chắn đứng
 * trước nó. Lớp chắn không trả envelope `{ success, error }`, nên `lib/api` rơi
 * về nguyên văn chuỗi của axios — "Request failed with status code 429". Bày
 * chuỗi đó ra cho nhân viên sale đọc thì thà dùng câu dự phòng tiếng Việt.
 */
function backendMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  return error.code === "INTERNAL_ERROR" ? null : error.message;
}

export function describeLoginError(error: unknown): LoginErrorInfo | null {
  if (!error) return null;

  const status = error instanceof ApiError ? error.status : undefined;

  /*
   * Bám vào MÃ TRẠNG THÁI chứ không vào mã lỗi trong envelope: 429 là thứ duy
   * nhất chắc chắn giống nhau dù câu từ chối đến từ backend hay từ lớp chắn
   * phía trước.
   */
  if (status === 429) {
    return {
      kind: "locked",
      message:
        backendMessage(error) ??
        "Nhập sai quá nhiều lần nên tạm thời bị chặn. Chờ ít phút rồi thử lại.",
      hint: "Gõ đúng mật khẩu lúc này cũng vẫn bị từ chối, và thử lại liên tục chỉ làm khoá kéo dài thêm. Cần vào gấp thì nhờ quản trị viên mở khoá.",
    };
  }

  if (status === 401) {
    return {
      kind: "credentials",
      message: errorMessage(error, "Sai tên đăng nhập hoặc mật khẩu."),
      hint: "Sai thêm vài lần nữa là tài khoản bị tạm khoá ít phút.",
    };
  }

  return {
    kind: "other",
    message: errorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."),
  };
}
