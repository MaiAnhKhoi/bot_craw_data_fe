"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Nút copy một chạm (dùng cho cột SĐT của bảng Địa điểm — thao tác lặp nhiều
 * nhất của người bán hàng: mở danh sách, copy số, gọi).
 *
 * `navigator.clipboard` không tồn tại trên origin không bảo mật (http trong
 * mạng LAN) và có thể bị người dùng từ chối quyền, nên mọi lời gọi đều bọc
 * try/catch: copy hỏng thì nút không đổi trạng thái, KHÔNG làm vỡ cả bảng.
 *
 * Timer báo "đã copy" được dọn khi unmount để không setState trên component
 * đã tháo (chuyện thường gặp khi bảng đổi trang ngay sau cú bấm).
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard — im lặng, người dùng vẫn bôi đen copy được.
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground", className)}
      onClick={handleCopy}
    >
      {copied ? (
        <CheckIcon className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CopyIcon />
      )}
    </Button>
  );
}
