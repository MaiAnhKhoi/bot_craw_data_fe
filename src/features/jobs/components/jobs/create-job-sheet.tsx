"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  MapPinnedIcon,
  PlusIcon,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/features/geo/components/location-picker";
import { KeywordLocalizer } from "@/features/keyword/components/keyword-localizer";
import { useLocationCountries } from "@/features/keyword/hooks/use-location-countries";
import {
  buildKeywordMap,
  countQueries,
} from "@/features/keyword/lib/keyword-map";
import { useCreateJob } from "@/features/jobs/hooks/use-job-mutations";
import { DETAIL_MODE_OPTIONS } from "@/features/jobs/lib/job-status";
import { mergeLocationLines } from "@/features/jobs/lib/locations-text";
import {
  JOB_FORM_DEFAULTS,
  jobFormSchema,
  toJobCreate,
  type JobFormInput,
} from "@/features/jobs/schemas/job-schema";
import { formatNumber, splitLines } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CountryKeywords } from "@/features/keyword/types";

/*
 * Panel tạo job quét, trượt vào từ mép phải.
 *
 * Dùng Sheet thay cho hộp thoại giữa màn hình: màn này có hai ô nhập nhiều dòng
 * (từ khoá, địa điểm) cộng bộ chọn địa giới 4 cấp. Hộp thoại bị giới hạn chiều
 * cao nên ô địa điểm chỉ còn 3 dòng — dán 168 dòng vào đó rồi soát lại là cực
 * hình. Panel cao hết màn hình, rộng tới 56rem, và trên màn rộng chia hai cột
 * để phần địa bàn có chỗ thở.
 *
 * Từ khoá và địa điểm nhập dạng "mỗi dòng một giá trị" — dán thẳng từ Excel
 * được. Backend nhân tổ hợp từ khoá × địa điểm, nên dòng "số truy vấn sẽ tạo"
 * hiện ngay dưới để người dùng thấy trước khối lượng công việc mình đặt ra.
 */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function CreateJobSheet() {
  const [open, setOpen] = useState(false);
  /*
   * Bộ chọn địa giới: thu gọn thì KHÔNG render. Không phải để cho gọn mắt — nó
   * unmount luôn các query danh mục, nên người tự gõ địa điểm không phải trả giá
   * bằng request nào (Rule 1). Mặc định mở vì panel đã đủ rộng để chứa.
   */
  const [pickerOpen, setPickerOpen] = useState(true);
  /*
   * Từ khoá bản địa đã DUYỆT, theo từng quốc gia. Để ở form chứ không trong khối
   * con: nó là một phần payload gửi lên `/jobs`, và khối con có thể ẩn đi khi
   * người dùng xoá hết địa điểm nước ngoài.
   */
  const [keywordItems, setKeywordItems] = useState<CountryKeywords[]>([]);
  const createJob = useCreateJob();

  const form = useForm<JobFormInput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: JOB_FORM_DEFAULTS,
  });

  const errors = form.formState.errors;
  /*
   * `useWatch` thay cho `form.watch(...)`: nó trả về GIÁ TRỊ, còn `watch` trả về
   * một hàm mà React Compiler không memo hoá an toàn được (cảnh báo
   * react-hooks/incompatible-library).
   */
  const keywordsText = useWatch({ control: form.control, name: "keywords" });
  const locationsText = useWatch({ control: form.control, name: "locations" });
  const keywords = useMemo(() => splitLines(keywordsText ?? ""), [keywordsText]);
  const locations = useMemo(
    () => splitLines(locationsText ?? ""),
    [locationsText],
  );
  const keywordCount = keywords.length;
  const locationCount = locations.length;

  /*
   * Số truy vấn THẬT.
   *
   * Không còn là phép nhân "từ khoá × địa điểm": khi có `keyword_map`, mỗi địa
   * điểm dùng bộ từ khoá của quốc gia nó thuộc về (Thái Lan 4 từ, Việt Nam 2 từ
   * thì hai địa điểm không còn sinh ra số truy vấn bằng nhau). Người dùng phải
   * thấy đúng khối lượng mình đặt ra trước khi bấm Tạo job.
   */
  const { codeByLocation } = useLocationCountries(locations);
  const keywordMap = useMemo(() => buildKeywordMap(keywordItems), [keywordItems]);
  const hasKeywordMap = Object.keys(keywordMap).length > 0;
  const queryCount = useMemo(
    () => countQueries(codeByLocation, keywordCount, keywordMap),
    [codeByLocation, keywordCount, keywordMap],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(JOB_FORM_DEFAULTS);
      setPickerOpen(true);
      setKeywordItems([]);
    }
  };

  /*
   * Bộ chọn địa giới chỉ GHI THÊM vào ô textarea — textarea vẫn là nguồn sự thật
   * duy nhất gửi lên `/jobs`. Dòng người dùng tự gõ được giữ nguyên, dòng trùng
   * bị bỏ (xem `mergeLocationLines`).
   */
  const handleAddLocations = (locations: string[]) => {
    const { text, added } = mergeLocationLines(
      form.getValues("locations"),
      locations,
    );
    if (added === 0) {
      toast.info("Các địa điểm này đã có trong danh sách.");
      return;
    }
    form.setValue("locations", text, { shouldDirty: true });
    toast.success(`Đã thêm ${added} địa điểm.`);
  };

  const handleClearLocations = () => {
    form.setValue("locations", "", { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit((input) => {
    createJob.mutate(toJobCreate(input, keywordMap), {
      onSuccess: () => handleOpenChange(false),
    });
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button size="sm" />}>
        <PlusIcon />
        Tạo job
      </SheetTrigger>

      {/*
       * `gap-0 p-0` ghi đè padding mặc định của SheetContent để header / thân /
       * hàng nút tự quản padding — nhờ vậy CHỈ phần thân cuộn, còn tiêu đề và
       * hai nút luôn nhìn thấy dù danh sách địa điểm dài bao nhiêu.
       */}
      <SheetContent
        side="right"
        /*
         * Phải ghi đè bằng ĐÚNG biến thể `data-[side=right]:` của sheet.tsx
         * (`w-3/4` và `sm:max-w-sm`). Viết `sm:max-w-none` trần thì
         * tailwind-merge không coi là xung đột nên cả hai class cùng tồn tại,
         * và class có data-attribute thắng — panel kẹt ở 384px.
         */
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:w-[34rem] data-[side=right]:sm:max-w-none data-[side=right]:lg:w-1/2 data-[side=right]:lg:min-w-[48rem]"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Tạo job quét</SheetTitle>
          <SheetDescription>
            Mỗi cặp từ khoá × địa điểm là một truy vấn Google Maps.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/*
           * `@container` + biến thể `@3xl:` : số cột phụ thuộc bề rộng của CHÍNH
           * panel, không phải bề rộng màn hình. Dùng `lg:` theo màn hình thì trên
           * màn 1920 panel vẫn chỉ là một dải hẹp mà đã bị ép thành 2 cột, chữ
           * xuống dòng từng từ một.
           */}
          <div className="@container min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-6 @2xl:grid-cols-2">
              {/* Cột trái: nhận dạng job và các tuỳ chọn quét */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="job-name">Tên job</Label>
                  <Input
                    id="job-name"
                    placeholder="vd: Nhà nhập khẩu trái cây miền Bắc"
                    aria-invalid={!!errors.name}
                    {...form.register("name")}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job-keywords">Từ khoá (mỗi dòng một từ)</Label>
                  <Textarea
                    id="job-keywords"
                    rows={6}
                    className="resize-y font-mono text-xs"
                    placeholder={
                      "công ty xuất nhập khẩu trái cây\nvựa trái cây\nnhà phân phối hoa quả"
                    }
                    aria-invalid={!!errors.keywords}
                    {...form.register("keywords")}
                  />
                  <FieldError message={errors.keywords?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label>Chế độ lấy chi tiết</Label>
                  <Controller
                    control={form.control}
                    name="detail_mode"
                    render={({ field }) => {
                      const current = DETAIL_MODE_OPTIONS.find(
                        (option) => option.value === field.value,
                      );
                      return (
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            value &&
                            field.onChange(value as JobFormInput["detail_mode"])
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>{() => current?.label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            {DETAIL_MODE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="job-max">Kết quả tối đa / truy vấn</Label>
                    <Input
                      id="job-max"
                      type="number"
                      min={1}
                      max={1000}
                      aria-invalid={!!errors.max_results_per_query}
                      {...form.register("max_results_per_query", {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError
                      message={errors.max_results_per_query?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="job-ttl">
                      Bỏ qua nếu đã quét trong (ngày)
                    </Label>
                    <Input
                      id="job-ttl"
                      type="number"
                      min={0}
                      max={3650}
                      aria-invalid={!!errors.ttl_days}
                      {...form.register("ttl_days", { valueAsNumber: true })}
                    />
                    <FieldError message={errors.ttl_days?.message} />
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="skip_recent_queries"
                  render={({ field }) => (
                    <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                      <span>
                        Bỏ qua địa bàn vừa quét
                        <span className="block text-xs font-normal text-muted-foreground">
                          Truy vấn đã chạy xong trong số ngày ở trên sẽ không mở
                          lại. Đây là chỗ tiết kiệm lớn nhất khi quét lại diện
                          rộng: mỗi truy vấn bỏ qua là 1-3 phút cuộn danh sách
                          để rồi thấy toàn địa điểm đã có.
                        </span>
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </label>
                  )}
                />

                <Controller
                  control={form.control}
                  name="enrich_website"
                  render={({ field }) => (
                    <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
                      <span>
                        Kiểm tra website sống/chết
                        <span className="block text-xs font-normal text-muted-foreground">
                          Chậm hơn nhưng chấm điểm sống/chết chính xác hơn nhiều.
                        </span>
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </label>
                  )}
                />
              </div>

              {/* Cột phải: chọn địa bàn */}
              <div className="space-y-3">
                <div className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((previous) => !previous)}
                    aria-expanded={pickerOpen}
                    aria-controls="geo-picker"
                    className="flex w-full items-center justify-between gap-2 rounded-lg p-2.5 text-sm font-medium outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="flex items-center gap-2">
                      <MapPinnedIcon className="size-4 shrink-0 text-muted-foreground" />
                      Chọn nhanh theo địa giới hành chính
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        pickerOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {pickerOpen ? (
                    <div id="geo-picker" className="border-t p-2.5">
                      <LocationPicker
                        keywordCount={keywordCount}
                        onAdd={handleAddLocations}
                        onClear={handleClearLocations}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job-locations">
                    Địa điểm (mỗi dòng một nơi, để trống nếu không giới hạn)
                  </Label>
                  {/*
                   * Cao hẳn và `resize-y`: danh sách sinh ra từ bộ chọn có thể tới
                   * hàng trăm dòng, phải soát và xoá bớt được ngay tại chỗ.
                   */}
                  <Textarea
                    id="job-locations"
                    rows={14}
                    className="min-h-64 resize-y font-mono text-xs"
                    placeholder={"Hà Nội\nHải Phòng\nTP Hồ Chí Minh"}
                    {...form.register("locations")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasKeywordMap
                      ? `Sẽ tạo ${formatNumber(queryCount)} truy vấn (mỗi quốc gia dùng bộ từ khoá riêng đã duyệt).`
                      : `Sẽ tạo ${formatNumber(queryCount)} truy vấn (${keywordCount} từ khoá × ${Math.max(locationCount, 1)} địa điểm).`}
                  </p>
                </div>

                {/*
                 * Khối duyệt từ khoá bản địa: TỰ ẩn khi danh sách địa điểm không
                 * chạm quốc gia nào ngoài Việt Nam, nên quét trong nước thì form
                 * vẫn gọn đúng như trước.
                 */}
                <KeywordLocalizer
                  keywords={keywords}
                  locations={locations}
                  value={keywordItems}
                  onChange={setKeywordItems}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t p-4">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Đóng
            </SheetClose>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Tạo job
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
