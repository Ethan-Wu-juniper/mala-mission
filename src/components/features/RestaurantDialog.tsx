import { ExternalLink, Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CITY_LABEL, type Submission } from "@/lib/types";

interface Props {
  submission: Submission | null;
  isSelf: boolean;
  myPoints: number;
  totalPoints?: number;
  onOpenChange: (open: boolean) => void;
}

export const RestaurantDialog = ({
  submission,
  isSelf,
  myPoints,
  totalPoints,
  onOpenChange,
}: Props) => {
  return (
    <Dialog open={!!submission} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {submission && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    submission.city === "sichuan"
                      ? "border-rose-400 text-rose-700"
                      : "border-amber-600 text-amber-700",
                  )}
                >
                  {CITY_LABEL[submission.city]}
                </Badge>
                {isSelf && (
                  <Badge variant="secondary" className="text-xs">
                    你的推薦
                  </Badge>
                )}
                {totalPoints !== undefined && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold">{totalPoints}</span>
                  </div>
                )}
                {totalPoints === undefined && myPoints > 0 && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: myPoints }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-500 text-amber-500"
                      />
                    ))}
                  </div>
                )}
              </div>
              <DialogTitle className="text-2xl leading-tight">
                {submission.restaurantName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {submission.dish && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-neutral-500">
                    推薦菜色
                  </div>
                  <div className="text-sm text-neutral-800">
                    {submission.dish}
                  </div>
                </div>
              )}

              {submission.mapsUrl && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-neutral-500">
                    Google Maps
                  </div>
                  <a
                    href={submission.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{submission.mapsUrl}</span>
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
