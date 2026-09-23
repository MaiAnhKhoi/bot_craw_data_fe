"use client";

import { useMemo, useState } from "react";
import {
  InfoIcon,
  LanguagesIcon,
  LoaderCircleIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useAiStatus,
  useLocalizeKeywords,
  useSaveKeywords,
} from "@/features/keyword/hooks/use-keywords";
import { useLocationCountries } from "@/features/keyword/hooks/use-location-countries";
import {
  keywordSourceClass,
  keywordSourceLabel,
} from "@/features/keyword/lib/keyword-source";
import {
  HOME_COUNTRY_CODE,
  normalizeKeywords,
} from "@/features/keyword/lib/keyword-map";
import { errorMessage } from "@/lib/api";
import { splitLines } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CountryKeywords } from "@/features/keyword/types";

/*
 * Duyệt từ khoá bản địa theo quốc gia, ngay trong form tạo job.
 *
 * Vì sao cần: từ khoá tiếng Việt gần như vô dụng khi quét nước ngoài. Đo thật —
 * "xuất nhập khẩu trái cây Bangkok" với gl=vn ra 2 kết quả và cả hai đều ở
 * TP.HCM (sai địa bàn hoàn toàn); "fruit wholesaler Bangkok" với gl=th ra 60+
 * kết quả Thái Lan. Backend đã tự chọn hl/gl theo từng địa điểm; việc còn lại là
 * để NGƯỜI DÙNG duyệt và sửa từ khoá trước khi job chạy.
 *
 * Ba luật chi phối component này:
 *
 * 1. CHỈ HIỆN khi danh sách địa điểm chạm vào ít nhất một quốc gia khác Việt Nam.
 *    Quét trong nước thì khối này chỉ làm rối form, nên render `null`.
 * 2. KHÔNG BAO GIỜ tự gọi `/keywords/localize` — mỗi lần gọi là một lần tiêu tiền
 *    AI. Chỉ chạy khi người dùng bấm nút, và cũng không tự gọi lại khi từ khoá
 *    hay địa bàn đổi (chỉ nhắc nhẹ).
 * 3. Backend không bao giờ trả lỗi vì AI: chưa có khoá / sai khoá / quá hạn mức
 *    đều trả về từ khoá gốc kèm `warning`. Vì vậy nút LUÔN bấm được, và cảnh báo
 *    hiện nguyên văn câu của backend thay vì FE tự đoán.
 *
 * Nguồn sự thật của danh sách nằm ở form cha (`value`/`onChange`) — component này
 * không giữ bản sao, để lúc submit form lấy đúng thứ đang hiện trên màn hình.
 */

const NEW_LINE = String.fromCharCode(10);
const MIN_ROWS = 2;
const MAX_ROWS = 8;

function toText(keywords: string[]): string {
  return keywords.join(NEW_LINE);
}

function rowsFor(text: string): number {
  const lines = text.length === 0 ? 1 : text.split(NEW_LINE).length;
  return Math.min(Math.max(lines, MIN_ROWS), MAX_ROWS);
}

interface KeywordLocalizerProps {
  /** Từ khoá gốc đang gõ trong form (đã tách dòng, bỏ dòng trống). */
  keywords: string[];
  /** Địa điểm đang gõ trong form — quốc gia suy ra từ đuôi mỗi dòng. */
  locations: string[];
  value: CountryKeywords[];
  onChange: (items: CountryKeywords[]) => void;
}

export function KeywordLocalizer({
  keywords,
  locations,
  value,
  onChange,
}: KeywordLocalizerProps) {
  /*
   * Bản nháp của ô đang gõ. Chỉ giữ dòng người dùng ĐANG sửa dở; gõ xong (blur)
   * thì bỏ nháp đi và lấy lại giá trị từ `value`. Nhờ vậy không cần effect đồng
   * bộ hai chiều, và lúc gợi ý lại thì mọi ô tự hiện bản mới.
   */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);
  /*
   * Bộ từ khoá gốc ĐÃ DÙNG lúc gợi ý. Backend tính khoá đệm từ bộ này, nên lúc
   * lưu bản sửa tay phải gửi đúng nó — gửi bộ từ khoá mới (người dùng vừa đổi ô
   * bên trái) sẽ ghi vào một ô đệm khác, bản sửa coi như rơi mất.
   */
  const [sourceKeywords, setSourceKeywords] = useState<string[] | null>(null);
  /** Chữ ký của lần gợi ý gần nhất, để biết từ khoá/địa bàn đã đổi hay chưa. */
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const { codes } = useLocationCountries(locations);
  const foreignCount = useMemo(
    () => codes.filter((code) => code !== HOME_COUNTRY_CODE).length,
    [codes],
  );

  /* Quét trong nước thì không hỏi trạng thái AI làm gì — khối này sẽ ẩn. */
  const aiStatus = useAiStatus(foreignCount > 0);
  const localize = useLocalizeKeywords();
  const save = useSaveKeywords();

  const signature = useMemo(
    () => `${normalizeKeywords(keywords).join("|")}@${codes.join(",")}`,
    [keywords, codes],
  );
  const stale = value.length > 0 && snapshot !== null && snapshot !== signature;

  /*
   * `ai_available` của lần gọi gần nhất đáng tin hơn `/keywords/status` đã cache,
   * nhưng chưa gọi lần nào thì dùng tạm status. Chưa biết (đang tải) thì coi như
   * có, để không doạ người dùng bằng cảnh báo sai.
   */
  const aiAvailable =
    localize.data?.ai_available ?? aiStatus.data?.ai_available ?? true;

  const hasKeywords = keywords.length > 0;

  /* Quét trong nước thì khối này không có việc gì để làm. */
  if (foreignCount === 0) return null;

  const handleLocalize = () => {
    localize.mutate(
      { keywords, locations },
      {
        onSuccess: (data) => {
          onChange(data.items);
          setWarning(data.warning);
          setSourceKeywords(keywords);
          setSnapshot(signature);
          setDrafts({});
          if (data.items.length === 0) {
            toast.info("Không nhận ra quốc gia nào trong danh sách địa điểm.");
          }
        },
        onError: (error) => {
          toast.error(errorMessage(error, "Không gợi ý được từ khoá bản địa."));
        },
      },
    );
  };

  /*
   * Sửa xong một ô: chỉ lưu khi nội dung THẬT SỰ đổi (so sau khi chuẩn hoá, nên
   * thêm dòng trống hay đổi thứ tự khoảng trắng không tính là sửa).
   */
  const handleBlur = (item: CountryKeywords, text: string) => {
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[item.country_code];
      return next;
    });

    const edited = normalizeKeywords(splitLines(text));
    const current = normalizeKeywords(item.keywords);
    if (toText(edited) === toText(current)) return;

    if (edited.length === 0) {
      toast.warning(
        `Chưa có từ khoá nào cho ${item.country_name}, giữ nguyên bản cũ.`,
      );
      return;
    }

    onChange(
      value.map((row) =>
        row.country_code === item.country_code
          ? { ...row, keywords: edited, source: "user" as const }
          : row,
      ),
    );

    save.mutate(
      {
        keywords: sourceKeywords ?? keywords,
        country_code: item.country_code,
        language: item.language,
        translated: edited,
      },
      {
        onSuccess: () => {
          toast.success(`Đã lưu từ khoá cho ${item.country_name}.`);
        },
        onError: (error) => {
          toast.error(
            errorMessage(
              error,
              `Không nhớ được bản sửa cho ${item.country_name} — job này vẫn dùng đúng từ khoá bạn vừa gõ.`,
            ),
          );
        },
      },
    );
  };

  return (
    <div className="space-y-2.5 rounded-lg border p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <LanguagesIcon className="size-4 shrink-0 text-muted-foreground" />
            Từ khoá bản địa theo quốc gia
          </p>
          <p className="text-xs text-muted-foreground">
            Từ khoá tiếng Việt gần như không ra kết quả ở nước ngoài. Duyệt và
            sửa trước khi chạy job.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleLocalize}
          disabled={!hasKeywords || localize.isPending}
        >
          {localize.isPending ? (
            <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
          ) : (
            <SparklesIcon />
          )}
          Gợi ý từ khoá bản địa
        </Button>
      </div>

      {!hasKeywords ? (
        <p className="text-xs text-muted-foreground">
          Nhập từ khoá ở cột bên trái trước đã.
        </p>
      ) : null}

      {!aiAvailable ? (
        <p className="text-xs text-muted-foreground">
          Chưa cấu hình khoá AI — sẽ dùng tạm từ khoá gốc. Đặt BCD_AI_API_KEY ở
          backend để bật.
        </p>
      ) : null}

      {warning ? (
        <p className="flex items-start gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{warning}</span>
        </p>
      ) : null}

      {stale ? (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>Từ khoá hoặc địa bàn vừa đổi, nên gợi ý lại.</span>
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((item) => {
            const text = drafts[item.country_code] ?? toText(item.keywords);
            return (
              <li
                key={item.country_code}
                className="space-y-1.5 rounded-md border bg-muted/30 p-2"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">
                    {item.country_name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.country_code} · {item.language}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("ms-auto", keywordSourceClass(item.source))}
                  >
                    {keywordSourceLabel(item.source)}
                  </Badge>
                </div>
                <Textarea
                  aria-label={`Từ khoá cho ${item.country_name}`}
                  rows={rowsFor(text)}
                  className="resize-y font-mono text-xs"
                  value={text}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDrafts((previous) => ({
                      ...previous,
                      [item.country_code]: next,
                    }));
                  }}
                  onBlur={(event) => handleBlur(item, event.target.value)}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
