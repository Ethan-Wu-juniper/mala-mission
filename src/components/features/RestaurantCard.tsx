import { ExternalLink, Flame, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { CITY_LABEL, type Submission } from "@/lib/types";

interface Props {
  submission: Submission;
  isSelf: boolean;
  myPoints: number;
  maxStars: number;
  remaining: number;
  disabled: boolean;
  totalPoints?: number;
  onCardClick: () => void;
  onSetPoints: (points: number) => void;
}

export const RestaurantCard = ({
  submission,
  isSelf,
  myPoints,
  maxStars,
  remaining,
  disabled,
  totalPoints,
  onCardClick,
  onSetPoints,
}: Props) => {
  const isSichuan = submission.city === "sichuan";
  const bannerGradient = isSichuan
    ? "from-rose-500 via-red-600 to-orange-500"
    : "from-amber-500 via-orange-600 to-rose-700";

  const showStarRating = !isSelf && totalPoints === undefined;
  const showTotalBadge = totalPoints !== undefined;

  const handleStarClick = (pos: number) => {
    if (disabled || isSelf) return;
    let nextPoints: number;
    if (pos === myPoints) {
      nextPoints = pos - 1;
    } else if (pos < myPoints) {
      nextPoints = pos;
    } else {
      const delta = pos - myPoints;
      nextPoints = delta > remaining ? myPoints + remaining : pos;
    }
    if (nextPoints !== myPoints) onSetPoints(nextPoints);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl",
        "ring-1 ring-black/5",
        isSelf && "opacity-80",
      )}
      onClick={onCardClick}
    >
      {/* banner */}
      <div
        className={cn(
          "relative aspect-[5/2] bg-gradient-to-br text-white",
          bannerGradient,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Flame className="w-20 h-20 text-white" />
        </div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3), transparent 50%)",
          }}
        />

        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm">
          <span className="text-[11px] font-bold tracking-[0.2em] text-white">
            {CITY_LABEL[submission.city]}
          </span>
        </div>

        {showStarRating && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center gap-0.5 p-1 rounded-full bg-black/25 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {Array.from({ length: maxStars }).map((_, i) => {
              const pos = i + 1;
              const filled = pos <= myPoints;
              const canClick =
                !disabled && (filled || remaining >= 1 || pos <= myPoints);
              return (
                <button
                  key={pos}
                  type="button"
                  className={cn(
                    "p-0.5 transition-all duration-150 active:scale-90",
                    canClick
                      ? "hover:scale-125 cursor-pointer"
                      : "opacity-40 cursor-not-allowed",
                  )}
                  onClick={() => canClick && handleStarClick(pos)}
                  disabled={!canClick}
                >
                  <Star
                    className={cn(
                      "w-4 h-4 transition-all duration-200",
                      filled
                        ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.8)]"
                        : "text-white/70",
                    )}
                  />
                </button>
              );
            })}
          </div>
        )}

        {showTotalBadge && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm shadow">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span className="text-xs font-bold text-white">{totalPoints}</span>
          </div>
        )}

        {isSelf && (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white">你的</span>
          </div>
        )}
      </div>

      {/* content */}
      <div className="bg-white p-4 space-y-2 min-h-[110px]">
        <h3 className="font-bold text-neutral-900 leading-tight text-base line-clamp-2">
          {submission.restaurantName}
        </h3>
        {submission.dish && (
          <p className="text-xs text-neutral-600 line-clamp-2">
            {submission.dish}
          </p>
        )}
        {submission.mapsUrl && (
          <div className="flex items-center gap-1 text-[11px] text-neutral-500 pt-0.5">
            <ExternalLink className="w-3 h-3" />
            <span>查看地圖</span>
          </div>
        )}
      </div>
    </div>
  );
};
