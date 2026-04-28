import { useState } from "react";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CITY_LABEL, type City } from "@/lib/types";

interface Props {
  city: City;
  tag?: string;
  onContinue?: () => void;
}

const FLIP_MS = 1600;

export const CityCard = ({ city, tag, onContinue }: Props) => {
  const [flipped, setFlipped] = useState(false);
  const [flipDone, setFlipDone] = useState(false);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    setTimeout(() => setFlipDone(true), FLIP_MS);
  };

  const cityClasses =
    city === "sichuan"
      ? "from-rose-600 via-red-600 to-orange-600"
      : "from-amber-600 via-orange-700 to-rose-800";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={cn(
          "relative w-64 h-96",
          !flipped && "cursor-pointer hover:scale-[1.02] transition-transform",
        )}
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: `transform ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border-2 border-amber-500/40 shadow-2xl flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-center space-y-4">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <div className="text-amber-400 font-bold tracking-[0.4em] text-sm">
                MALA
              </div>
              <div className="text-amber-400/60 text-xs tracking-widest">
                MISSION
              </div>
            </div>
            <div className="absolute inset-3 rounded-xl border border-amber-500/20 pointer-events-none" />
          </div>

          <div
            className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-br shadow-2xl flex items-center justify-center text-white",
              cityClasses,
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-center space-y-4">
              <Flame className="w-16 h-16 mx-auto drop-shadow-lg" />
              <div className="text-5xl font-bold tracking-widest drop-shadow-lg">
                {CITY_LABEL[city]}
              </div>
              <div className="text-sm tracking-[0.3em] opacity-80">
                {city === "sichuan" ? "CHENGDU" : "CHONGQING"}
              </div>
              {tag && (
                <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-bold tracking-widest">
                  {tag}
                </div>
              )}
            </div>
            <div className="absolute inset-3 rounded-xl border border-white/20 pointer-events-none" />
          </div>
        </div>
      </div>

      {flipDone && (
        <Button
          onClick={onContinue}
          className="bg-rose-600 hover:bg-rose-700 animate-in fade-in duration-500"
        >
          填寫推薦餐廳
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
};
