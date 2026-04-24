import { ExternalLink } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import type { Submission } from "@/lib/types";

interface Props {
  submission: Submission | null;
  isSelf: boolean;
  myPoints: number;
  maxStars: number;
  remaining: number;
  disabled: boolean;
  totalPoints?: number;
  onSetPoints: (points: number) => void;
  onOpenChange: (open: boolean) => void;
}

export const RestaurantDialog = ({
  submission,
  isSelf,
  myPoints,
  maxStars,
  remaining,
  disabled,
  totalPoints,
  onSetPoints,
  onOpenChange,
}: Props) => {
  return (
    <Dialog open={!!submission} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] sm:max-w-[340px] p-0 bg-transparent border-0 shadow-none gap-0 [&>button]:hidden">
        {submission && (
          <div className="space-y-3">
            <RestaurantCard
              submission={submission}
              isSelf={isSelf}
              myPoints={myPoints}
              maxStars={maxStars}
              remaining={remaining}
              disabled={disabled}
              totalPoints={totalPoints}
              onCardClick={() => {}}
              onSetPoints={onSetPoints}
            />
            {submission.mapsUrl && (
              <a
                href={submission.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white rounded-xl px-5 py-3 text-sm font-semibold text-neutral-800 shadow-lg hover:shadow-xl transition"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
                <span>在 Google Maps 開啟</span>
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
