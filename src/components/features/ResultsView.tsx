import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import { RestaurantDialog } from "@/components/features/RestaurantDialog";
import type { Submission, Vote } from "@/lib/types";

interface Props {
  submissions: Submission[];
  votes: Vote[];
  myUid: string;
}

export const ResultsView = ({ submissions, votes, myUid }: Props) => {
  const [opened, setOpened] = useState<Submission | null>(null);

  const ranked = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const v of votes) {
      for (const [recipient, pts] of Object.entries(v.allocations)) {
        totals[recipient] = (totals[recipient] ?? 0) + pts;
      }
    }
    return [...submissions]
      .map((s) => ({ submission: s, total: totals[s.playerId] ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }, [submissions, votes]);

  const winnerTotal = ranked[0]?.total ?? 0;
  const winners = ranked.filter((r) => r.total === winnerTotal && winnerTotal > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
        <h1 className="text-2xl font-bold text-neutral-900">投票結果</h1>
        {winners.length === 1 ? (
          <p className="text-sm text-neutral-600">
            由《
            <span className="font-bold text-rose-600">
              {winners[0].submission.restaurantName}
            </span>
            》勝出
          </p>
        ) : winners.length > 1 ? (
          <p className="text-sm text-neutral-600">
            共有 {winners.length} 間餐廳並列第一
          </p>
        ) : (
          <p className="text-sm text-neutral-600">大家都沒投票欸</p>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        {ranked.map(({ submission, total }, idx) => {
          const isWinner = total === winnerTotal && winnerTotal > 0;
          return (
            <div key={submission.playerId} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <Badge
                  variant={isWinner ? "default" : "secondary"}
                  className={
                    isWinner
                      ? "bg-amber-500 hover:bg-amber-500 text-white"
                      : ""
                  }
                >
                  #{idx + 1}
                </Badge>
                {isWinner && (
                  <span className="text-xs font-semibold text-amber-600">
                    勝出
                  </span>
                )}
              </div>
              <RestaurantCard
                submission={submission}
                isSelf={submission.playerId === myUid}
                myPoints={0}
                maxStars={3}
                remaining={0}
                disabled
                totalPoints={total}
                onCardClick={() => setOpened(submission)}
                onSetPoints={() => {}}
              />
            </div>
          );
        })}
      </div>

      <RestaurantDialog
        submission={opened}
        isSelf={opened?.playerId === myUid}
        myPoints={0}
        totalPoints={
          opened
            ? ranked.find((r) => r.submission.playerId === opened.playerId)?.total
            : undefined
        }
        onOpenChange={(open) => !open && setOpened(null)}
      />
    </div>
  );
};
