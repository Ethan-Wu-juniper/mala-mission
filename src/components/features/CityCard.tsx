import { useState } from "react";
import { Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CITY_LABEL, type City } from "@/lib/types";

interface Props {
  city: City;
  onRevealed?: () => void;
}

export const CityCard = ({ city, onRevealed }: Props) => {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    setTimeout(() => onRevealed?.(), 700);
  };

  const cityClasses =
    city === "sichuan"
      ? "from-rose-600 via-red-600 to-orange-600"
      : "from-amber-600 via-orange-700 to-rose-800";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-64 h-96 cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
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
                {city === "sichuan" ? "SICHUAN" : "CHONGQING"}
              </div>
            </div>
            <div className="absolute inset-3 rounded-xl border border-white/20 pointer-events-none" />
          </div>
        </div>
      </div>

      {!flipped && (
        <Button
          onClick={handleFlip}
          className="bg-amber-600 hover:bg-amber-700"
        >
          翻牌揭曉城市
        </Button>
      )}
    </div>
  );
};
