import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api";

/*
 * Mutator cho Orval: mọi hàm sinh tự động sẽ gọi qua đây, tức là qua CÙNG một
 * axios instance với code viết tay — giữ nguyên interceptor JWT, bóc envelope
 * và xử lý 401. Chưa dùng ở lần dựng đầu (xem README §Đồng bộ Orval) nhưng để
 * sẵn để `npm run api:sync` chạy được ngay khi backend lên.
 */
export function customInstance<T>(config: AxiosRequestConfig): Promise<T> {
  return api({ ...config }).then((response) => response.data as T);
}

export default customInstance;
