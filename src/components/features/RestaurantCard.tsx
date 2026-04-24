import { ExternalLink, Minus, Plus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CITY_LABEL, type Submission } from "@/lib/types";

interface Props {
  submission: Submission;
  isSelf: boolean;
  myPoints: number;
  canIncrement: boolean;
  disabled: boolean;
  totalPoints?: number;
  onCardClick: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const RestaurantCard = ({
  submission,
  isSelf,
  myPoints,
  canIncrement,
  disabled,
  totalPoints,
  onCardClick,
  onIncrement,
  onDecrement,
}: Props) => {
  const cityClasses =
    submission.city === "sichuan"
      ? "border-rose-300 bg-rose-50/80"
      : "border-amber-300 bg-amber-50/80";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition cursor-pointer hover:shadow-md",
        cityClasses,
        isSelf && "opacity-70",
      )}
      onClick={onCardClick}
    >
      {myPoints > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          {Array.from({ length: myPoints }).map((_, i) => (
            <Star
              key={i}
              className="w-3 h-3 fill-amber-500 text-amber-500"
            />
          ))}
        </div>
      )}

      {totalPoints !== undefined && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-bold text-neutral-900">
            {totalPoints}
          </span>
        </div>
      )}

      <div className="space-y-3 pr-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0",
              submission.city === "sichuan"
                ? "border-rose-400 text-rose-700"
                : "border-amber-600 text-amber-700",
            )}
          >
            {CITY_LABEL[submission.city]}
          </Badge>
          {isSelf && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              你的
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-neutral-900 leading-snug">
            {submission.restaurantName}
          </h3>
          {submission.dish && (
            <p className="text-xs text-neutral-600 line-clamp-2">
              {submission.dish}
            </p>
          )}
        </div>

        {submission.mapsUrl && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">Maps</span>
          </div>
        )}
      </div>

      {!isSelf && totalPoints === undefined && (
        <div
          className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-neutral-200/60"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={onDecrement}
            disabled={disabled || myPoints === 0}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-semibold text-neutral-700 min-w-[3ch] text-center">
            {myPoints}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={onIncrement}
            disabled={disabled || !canIncrement}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
