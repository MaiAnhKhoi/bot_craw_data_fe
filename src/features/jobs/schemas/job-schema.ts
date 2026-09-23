import { z } from "zod";
import { splitLines } from "@/lib/format";
import type { JobCreate } from "@/features/jobs/types/job";

/*
 * Nguồn chân lý DUY NHẤT cho validation form "Tạo job".
 *
 * Schema mô tả đúng thứ người dùng GÕ (hai ô textarea, mỗi dòng một giá trị),
 * không phải DTO gửi đi. Việc đổi sang `JobCreate` do `toJobCreate` làm — tách
 * ra để thông điệp lỗi luôn trỏ đúng ô trên màn hình.
 */
export const jobFormSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên job.").max(120, "Tên tối đa 120 ký tự."),
  keywords: z
    .string()
    .refine((value) => splitLines(value).length > 0, "Nhập ít nhất một từ khoá."),
  locations: z.string(),
  detail_mode: z.enum(["always", "missing_only", "never"]),
  enrich_website: z.boolean(),
  ttl_days: z
    .number({ message: "Nhập số ngày." })
    .int("Số ngày phải là số nguyên.")
    .min(0, "Số ngày không được âm.")
    .max(3650, "Tối đa 3650 ngày."),
  max_results_per_query: z
    .number({ message: "Nhập số kết quả." })
    .int("Phải là số nguyên.")
    .min(1, "Tối thiểu 1 kết quả.")
    .max(1000, "Tối đa 1000 kết quả mỗi truy vấn."),
});

export type JobFormInput = z.infer<typeof jobFormSchema>;

/** Giá trị mặc định khớp mặc định của backend (docs/API_CONTRACT.md §2). */
export const JOB_FORM_DEFAULTS: JobFormInput = {
  name: "",
  keywords: "",
  locations: "",
  detail_mode: "missing_only",
  enrich_website: true,
  ttl_days: 90,
  max_results_per_query: 200,
};

/* Đổi giá trị form sang DTO JobCreate: tách textarea thành mảng, bỏ dòng trống. */
export function toJobCreate(input: JobFormInput): JobCreate {
  const locations = splitLines(input.locations);
  return {
    name: input.name.trim(),
    keywords: splitLines(input.keywords),
    locations: locations.length > 0 ? locations : undefined,
    detail_mode: input.detail_mode,
    enrich_website: input.enrich_website,
    ttl_days: input.ttl_days,
    max_results_per_query: input.max_results_per_query,
  };
}
