"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BookmarkPlusIcon,
  LoaderCircleIcon,
  Trash2Icon,
  TriangleAlertIcon,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/features/geo/components/searchable-combobox";
import {
  useDeleteKeywordSet,
  useKeywordSets,
  useUpsertKeywordSet,
} from "@/features/keyword/hooks/use-keyword-sets";
import {
  findSetByName,
  keywordSetLabel,
  keywordSetSearchText,
  normalizeSetName,
  sameKeywordSet,
} from "@/features/keyword/lib/keyword-sets";
import type { KeywordSet } from "@/features/keyword/types";

/*
 * Chọn lại một bộ từ khoá đã lưu, ngay cạnh ô "Từ khoá" của form tạo job.
 *
 * Vì sao có màn này: nút "Gợi ý từ khoá bản địa" gọi AI, và mỗi lượt gọi là
 * tiền thật. Backend đã nhớ sẵn bản dịch theo (bộ từ khoá gốc, quốc gia) — gõ
 * lại y hệt bộ cũ là dùng lại MIỄN PHÍ. Nhưng khoá đó vỡ khi thiếu một từ hay
 * sai một chữ: lúc đó là một bộ khác, AI bị gọi lại từ đầu cho MỌI nước. Trước
 * đây người dùng không có cách nào gọi lại đúng bộ cũ ngoài việc nhớ rồi gõ
 * tay. Component này chỉ làm đúng một việc: bỏ hẳn bước gõ tay đó đi.
 *
 * Hai quy ước bám theo đó:
 *
 * 1. Chọn một bộ là THAY TOÀN BỘ ô từ khoá, không phải thêm vào. Thêm vào sẽ
 *    tạo ra một bộ thứ ba chưa từng được dịch — đúng cái bẫy đang muốn tránh.
 * 2. Số nước đã dịch sẵn nằm ngay trong nhãn của từng bộ, vì đó là con số
 *    quyết định người dùng chọn bộ nào.
 *
 * Component KHÔNG bao giờ gọi `/keywords/localize`. Việc gọi AI vẫn chỉ xảy ra
 * khi người dùng bấm nút "Gợi ý từ khoá bản địa" ở khối bên dưới.
 */

interface KeywordSetPickerProps {
  /** Từ khoá đang gõ trong ô của form (đã tách dòng, bỏ dòng trống). */
  keywords: string[];
  /** Điền thẳng bộ đã chọn vào ô từ khoá — nguồn sự thật vẫn là form cha. */
  onApply: (keywords: string[]) => void;
}

export function KeywordSetPicker({
  keywords,
  onApply,
}: KeywordSetPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  /*
   * Bộ sắp bị ghi đè. `null` = đang ở bước đặt tên; khác `null` = đã hỏi và
   * đang chờ xác nhận. Một state thay cho hộp thoại thứ hai chồng lên hộp thoại
   * thứ nhất — vẫn là hai bước rõ ràng, không ghi đè lặng lẽ.
   *
   * CHỈ dọn lúc MỞ hộp thoại, không dọn lúc đóng: hộp thoại còn nằm trên màn
   * hình suốt hiệu ứng đóng, dọn sớm thì người dùng thấy nó nháy về bước đặt
   * tên ngay sau khi vừa bấm "Ghi đè".
   */
  const [pendingOverwrite, setPendingOverwrite] = useState<KeywordSet | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* Cũng vì hiệu ứng đóng: giữ riêng bộ sắp xoá, đừng đọc `selected` — danh
   * sách làm mới xong là `selected` hoá `null` và hộp thoại đang đóng sẽ nháy
   * sang "Chưa chọn bộ nào". */
  const [deleteTarget, setDeleteTarget] = useState<KeywordSet | null>(null);

  const query = useKeywordSets();
  const upsert = useUpsertKeywordSet();
  const remove = useDeleteKeywordSet();

  const sets = useMemo(() => query.data ?? [], [query.data]);
  const options = useMemo<ComboboxOption[]>(
    () =>
      sets.map((set) => ({
        value: String(set.id),
        label: keywordSetLabel(set),
        searchText: keywordSetSearchText(set),
      })),
    [sets],
  );
  const selected = useMemo(
    () => sets.find((set) => String(set.id) === selectedId) ?? null,
    [sets, selectedId],
  );

  const trimmedName = normalizeSetName(name);
  const conflict = findSetByName(sets, trimmedName);
  const canSubmit =
    trimmedName.length > 0 && keywords.length > 0 && !upsert.isPending;

  const handleSelect = (value: string | null) => {
    setSelectedId(value);
    const set = sets.find((item) => String(item.id) === value);
    if (!set) return;
    onApply(set.keywords);
    toast.success(
      `Đã điền ${set.keywords.length} từ khoá từ bộ "${set.name}".`,
    );
  };

  const handleOpenSave = () => {
    /*
     * Gợi sẵn tên bộ đang chọn: "mở bộ cũ - sửa vài từ - lưu đè" là đường đi
     * thường gặp nhất, và gợi sẵn tên cũng là lời nhắc rằng lưu tiếp sẽ đụng
     * vào bộ đó. Đặt state ở đây (trong sự kiện) chứ không trong effect.
     */
    setName(selected ? selected.name : "");
    setPendingOverwrite(null);
    setSaveOpen(true);
  };

  const submitSave = () => {
    upsert.mutate(
      { name: trimmedName, keywords },
      {
        onSuccess: (set) => {
          setSaveOpen(false);
          // Chọn luôn bộ vừa lưu: nút Xoá và dòng "đã dịch N nước" cần một bộ
          // đang chọn, và người dùng vừa nói rõ họ quan tâm bộ nào.
          setSelectedId(String(set.id));
        },
      },
    );
  };

  /*
   * `stopPropagation` KHÔNG thừa: hộp thoại này được portal ra ngoài DOM của
   * form tạo job, nhưng sự kiện React vẫn nổi bọt theo CÂY REACT — không chặn
   * thì bấm "Lưu" ở đây sẽ kích luôn `onSubmit` của form cha và tạo một job
   * ngoài ý muốn.
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canSubmit) return;
    if (conflict && pendingOverwrite === null) {
      setPendingOverwrite(conflict);
      return;
    }
    submitSave();
  };

  const handleOpenDelete = () => {
    if (!selected) return;
    setDeleteTarget(selected);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelectedId(null);
      },
    });
  };

  const translated = selected?.translated_countries ?? [];
  const deleteTranslated = deleteTarget?.translated_countries ?? [];

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label htmlFor="job-keyword-set">Bộ từ khoá đã lưu</Label>
        {/*
         * `type="button"`: mọi nút trong panel này nằm trong form tạo job, để
         * mặc định `submit` là bấm một cái tạo luôn job.
         */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleOpenSave}
          disabled={keywords.length === 0}
        >
          <BookmarkPlusIcon />
          Lưu bộ từ khoá
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <SearchableCombobox
          id="job-keyword-set"
          items={options}
          value={selectedId}
          onValueChange={handleSelect}
          placeholder="Chọn bộ đã lưu..."
          searchPlaceholder="Tìm theo tên, từ khoá hoặc mã nước..."
          emptyText="Chưa lưu bộ nào."
          loading={query.isLoading}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Xoá bộ từ khoá đang chọn"
          onClick={handleOpenDelete}
          disabled={selected === null || remove.isPending}
        >
          <Trash2Icon />
        </Button>
      </div>

      {query.isError ? (
        <p className="text-xs text-destructive">
          Không tải được danh sách bộ từ khoá.
        </p>
      ) : selected === null ? (
        <p className="text-xs text-muted-foreground">
          Gõ lại tay mà sai một chữ là một bộ khác, và AI phải dịch lại từ đầu
          cho mọi nước. Chọn ở đây để lấy đúng bộ cũ.
        </p>
      ) : translated.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="cursor-default underline decoration-dotted underline-offset-2" />
              }
            >
              {translated.length} nước đã dịch sẵn
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <span className="font-mono break-words">
                {translated.join(", ")}
              </span>
            </TooltipContent>
          </Tooltip>{" "}
          — quét ở những nước này thì lượt gợi ý lấy từ bộ nhớ đệm, không tốn
          tiền AI.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Bộ này chưa có bản dịch nào — lượt gợi ý đầu tiên sẽ gọi AI.
        </p>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingOverwrite ? "Ghi đè bộ đã có?" : "Lưu bộ từ khoá"}
            </DialogTitle>
            <DialogDescription>
              {pendingOverwrite
                ? `Tên "${pendingOverwrite.name}" đã được dùng. Lưu tiếp là thay bộ cũ, không tạo thêm bộ mới.`
                : "Đặt tên để lần sau chọn lại đúng bộ này, khỏi gõ tay."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {pendingOverwrite ? (
              <div className="space-y-2 text-xs">
                <p className="text-muted-foreground">
                  Bộ cũ: {pendingOverwrite.keywords.length} từ khoá,{" "}
                  {pendingOverwrite.translated_countries.length} nước đã dịch
                  sẵn.
                </p>
                {/*
                 * Ghi đè bằng ĐÚNG bộ từ khoá cũ thì không mất gì (khoá đệm
                 * không đổi). Chỉ cảnh báo khi từ khoá thật sự khác — doạ nhầm
                 * vài lần là lần sau không ai đọc cảnh báo nữa.
                 */}
                {sameKeywordSet(pendingOverwrite.keywords, keywords) ? (
                  <p className="text-muted-foreground">
                    Từ khoá không đổi, chỉ ghi lại — phần đã dịch vẫn dùng được
                    như cũ.
                  </p>
                ) : (
                  <p className="flex items-start gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Từ khoá mới khác bộ cũ. Bản dịch của{" "}
                      {pendingOverwrite.translated_countries.length} nước kia
                      vẫn còn ở máy chủ nhưng không còn gọi lại được bằng tên
                      này — muốn dùng lại phải gõ đúng từng từ khoá cũ.
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="keyword-set-name">Tên bộ</Label>
                <Input
                  id="keyword-set-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="vd: Trái cây xuất khẩu"
                  autoComplete="off"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">
                  Lưu {keywords.length} từ khoá đang có trong ô.
                </p>
                {conflict ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Trùng tên với một bộ đã lưu — sẽ hỏi lại trước khi ghi đè.
                  </p>
                ) : null}
              </div>
            )}

            <DialogFooter>
              {pendingOverwrite ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingOverwrite(null)}
                >
                  Quay lại
                </Button>
              ) : (
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Huỷ
                </DialogClose>
              )}
              <Button type="submit" disabled={!canSubmit}>
                {upsert.isPending ? (
                  <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
                ) : null}
                {pendingOverwrite ? "Ghi đè" : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá bộ từ khoá?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Bộ "${deleteTarget.name}" sẽ biến mất khỏi danh sách chọn nhanh.`
                : "Chưa chọn bộ nào."}
            </DialogDescription>
          </DialogHeader>

          {/*
           * Nói đúng thứ bị mất: xoá bộ KHÔNG xoá bản dịch đã lưu ở máy chủ, nó
           * chỉ bỏ lối gọi lại. Nhưng muốn chạm vào bản dịch đó thì phải gõ
           * đúng từng từ khoá như cũ — tức là mất đúng cái tiện lợi này.
           */}
          {deleteTranslated.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Bản dịch của {deleteTranslated.length} nước vẫn còn ở máy chủ,
              nhưng muốn dùng lại thì phải gõ đúng từng từ khoá như cũ — đó đúng
              là việc mà bộ đã lưu đang làm hộ bạn.
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Huỷ
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTarget === null || remove.isPending}
            >
              {remove.isPending ? (
                <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
              ) : null}
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
