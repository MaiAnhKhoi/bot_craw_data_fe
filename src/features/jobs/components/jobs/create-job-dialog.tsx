"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  MapPinnedIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/features/geo/components/location-picker";
import { useCreateJob } from "@/features/jobs/hooks/use-job-mutations";
import { DETAIL_MODE_OPTIONS } from "@/features/jobs/lib/job-status";
import { mergeLocationLines } from "@/features/jobs/lib/locations-text";
import {
  JOB_FORM_DEFAULTS,
  jobFormSchema,
  toJobCreate,
  type JobFormInput,
} from "@/features/jobs/schemas/job-schema";
import { splitLines } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Dialog tạo job quét.
 *
 * Từ khoá và địa điểm nhập dạng textarea "mỗi dòng một giá trị" — người dùng
 * dán thẳng từ Excel được, không phải bấm thêm từng dòng. Backend nhân tổ hợp
 * từ khoá × địa điểm, nên dòng "số truy vấn sẽ tạo" hiện ngay dưới hai ô để
 * người dùng thấy trước khối lượng công việc mình vừa đặt ra.
 */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function CreateJobDialog() {
  const [open, setOpen] = useState(false);
  /*
   * Bộ chọn địa giới mặc định THU GỌN, và khi thu gọn thì không render.
   * Không phải để cho gọn mắt: nó unmount luôn cả các query danh mục, nên người
   * dùng tự gõ địa điểm không phải trả giá bằng request nào (Rule 1).
   */
  const [pickerOpen, setPickerOpen] = useState(false);
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
  const keywordCount = splitLines(keywordsText ?? "").length;
  const locationCount = splitLines(locationsText ?? "").length;
  const queryCount = keywordCount * Math.max(locationCount, 1);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(JOB_FORM_DEFAULTS);
      setPickerOpen(false);
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
    createJob.mutate(toJobCreate(input), {
      onSuccess: () => handleOpenChange(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        Tạo job
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo job quét</DialogTitle>
          <DialogDescription>
            Mỗi cặp từ khoá × địa điểm là một truy vấn Google Maps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
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
              rows={4}
              className="font-mono text-xs"
              placeholder={"công ty xuất nhập khẩu trái cây\nvựa trái cây\nnhà phân phối hoa quả"}
              aria-invalid={!!errors.keywords}
              {...form.register("keywords")}
            />
            <FieldError message={errors.keywords?.message} />
          </div>

          <div className="space-y-1.5">
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

            <Label htmlFor="job-locations">
              Địa điểm (mỗi dòng một nơi, để trống nếu không giới hạn)
            </Label>
            <Textarea
              id="job-locations"
              rows={3}
              className="font-mono text-xs"
              placeholder={"Hà Nội\nHải Phòng\nTP Hồ Chí Minh"}
              {...form.register("locations")}
            />
            <p className="text-xs text-muted-foreground">
              Sẽ tạo {queryCount} truy vấn ({keywordCount} từ khoá ×{" "}
              {Math.max(locationCount, 1)} địa điểm).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>

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
              <FieldError message={errors.max_results_per_query?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-ttl">Bỏ qua nếu đã quét trong (ngày)</Label>
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

            <div className="sm:col-span-2">
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
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Đóng
            </DialogClose>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : null}
              Tạo job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
