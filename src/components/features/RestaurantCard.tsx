import { ExternalLink, Flame, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { CITY_LABEL, type Submission } from "@/lib/types";
import { useMapImage } from "@/hooks/use-map-image";

interface Props {
  submission: Submission;
  isSelf: boolean;
  myPoints: number;
  maxStars: number;
  remaining: number;
  disabled: boolean;
  totalPoints?: number;
  playerName?: string;
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
  playerName,
  onCardClick,
  onSetPoints,
}: Props) => {
  const isSichuan = submission.city === "sichuan";
  const gradient = isSichuan
    ? "from-rose-600 via-red-600 to-orange-600"
    : "from-amber-600 via-orange-700 to-rose-800";

  const fetchedImage = useMapImage(submission.mapsUrl || undefined);
  const hasImage = !!fetchedImage;

  const showStars = !isSelf && totalPoints === undefined;
  const showTotal = totalPoints !== undefined;

  const handleStarClick = (pos: number) => {
    if (disabled || isSelf) return;
    let nextPoints: number;
    if (pos === myPoints) nextPoints = pos - 1;
    else if (pos < myPoints) nextPoints = pos;
    else {
      const delta = pos - myPoints;
      nextPoints = delta > remaining ? myPoints + remaining : pos;
    }
    if (nextPoints !== myPoints) onSetPoints(nextPoints);
  };

  return (
    <div
      className={cn(
        "relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer",
        "text-white transition-transform duration-200 hover:-translate-y-1",
        !hasImage && `bg-gradient-to-br ${gradient}`,
        isSelf && "opacity-80",
      )}
      onClick={onCardClick}
    >
      {hasImage && (
        <img
          src={fetchedImage!}
          alt={submission.restaurantName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
      )}
      {!hasImage && (
        <div className="absolute inset-3 rounded-xl border border-white/20 pointer-events-none" />
      )}

      {/* top row: city badge + stars/total/self */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
        <div className="px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-[0.25em] text-white">
            {CITY_LABEL[submission.city]}
          </span>
        </div>

        {showStars && (
          <div
            className="flex items-center gap-0.5 p-1 rounded-full bg-black/30 backdrop-blur-sm"
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
                        ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                        : "text-white/70",
                    )}
                  />
                </button>
              );
            })}
          </div>
        )}

        {showTotal && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm shadow">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span className="text-xs font-bold">{totalPoints}</span>
          </div>
        )}

        {isSelf && (
          <div className="px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-sm">
            <span className="text-[10px] font-semibold">你的</span>
          </div>
        )}
      </div>

      {!hasImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className="w-9 h-9 drop-shadow-lg opacity-90" />
        </div>
      )}

      {/* bottom: name + dish + maps left, from right */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-4 pt-6 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight drop-shadow-md line-clamp-2">
            {submission.restaurantName}
          </h3>
          {submission.dish && (
            <p className="text-xs opacity-85 drop-shadow line-clamp-1 leading-relaxed mt-1">
              {submission.dish}
            </p>
          )}
          {submission.mapsUrl && (
            <div className="flex items-center gap-1 mt-2 text-[10px] tracking-widest opacity-70">
              <ExternalLink className="w-2.5 h-2.5" />
              <span>MAPS</span>
            </div>
          )}
        </div>
        {playerName && (
          <div className="shrink-0 text-right">
            <span className="text-[10px] opacity-70 leading-none">from</span>
            <p className="text-[11px] font-semibold drop-shadow leading-tight">{playerName}</p>
          </div>
        )}
      </div>
    </div>
  );
};
