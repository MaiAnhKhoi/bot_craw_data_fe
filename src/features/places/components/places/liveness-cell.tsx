import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LIVENESS_META,
  livenessReasonLabels,
} from "@/features/places/lib/liveness";
import type { Place } from "@/features/places/types/place";

/*
 * Ô "Tình trạng": huy hiệu sống/chết + điểm, tooltip liệt kê lý do đã dịch.
 *
 * Điểm số trần trụi không nói lên điều gì — người dùng cần biết VÌ SAO một địa
 * điểm bị chấm là chết thì mới dám bỏ nó khỏi danh sách gọi. Vì thế lý do luôn
 * đi kèm, và luôn bằng tiếng Việt (bảng dịch ở features/places/lib/liveness.ts).
 */
export function LivenessCell({ place }: { place: Place }) {
  const meta = LIVENESS_META[place.liveness_label];
  const reasons = livenessReasonLabels(place.liveness_reasons);

  const badge = (
    <Badge
      variant="secondary"
      className={cn("cursor-default gap-1.5", meta.badgeClass)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
      <span className="tabular-nums opacity-70">{place.liveness_score}</span>
    </Badge>
  );

  if (reasons.length === 0) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {badge}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <ul className="list-inside list-disc space-y-0.5 text-left">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
