import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import { RestaurantDialog } from "@/components/features/RestaurantDialog";
import type { Submission, Vote } from "@/lib/types";

interface Props {
  submissions: Submission[];
  myUid: string;
  budget: number;
  myVote: Vote | null;
  finalizedCount: number;
  capacity: number;
  onUpdateVote: (allocations: Record<string, number>) => Promise<void>;
  onFinalize: (allocations: Record<string, number>) => Promise<void>;
}

export const VotingView = ({
  submissions,
  myUid,
  budget,
  myVote,
  finalizedCount,
  capacity,
  onUpdateVote,
  onFinalize,
}: Props) => {
  const [allocations, setAllocations] = useState<Record<string, number>>(
    myVote?.allocations ?? {},
  );
  const [opened, setOpened] = useState<Submission | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const initialized = useRef(false);

  // Hydrate local state from remote once
  useEffect(() => {
    if (initialized.current) return;
    if (myVote) {
      setAllocations(myVote.allocations);
      initialized.current = true;
    }
  }, [myVote]);

  const finalized = myVote?.finalized ?? false;

  const used = useMemo(
    () => Object.values(allocations).reduce((a, b) => a + b, 0),
    [allocations],
  );
  const remaining = budget - used;

  const handleDelta = (recipientUid: string, delta: number) => {
    const current = allocations[recipientUid] ?? 0;
    const next = current + delta;
    if (next < 0) return;
    if (delta > 0 && remaining <= 0) return;
    const newAllocations = { ...allocations, [recipientUid]: next };
    if (next === 0) delete newAllocations[recipientUid];
    setAllocations(newAllocations);
    void onUpdateVote(newAllocations);
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await onFinalize(allocations);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">投票</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          你有 <span className="font-bold text-rose-600">{budget}</span>{" "}
          點，<span className="font-semibold text-neutral-900">必須全部用完</span>才能送出。可以全壓一間、也可以分散。不能投給自己。
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 border border-neutral-200">
        <div className="space-y-0.5">
          <div className="text-xs text-neutral-500">剩餘點數</div>
          <div className="text-2xl font-bold text-rose-600">{remaining}</div>
        </div>
        <div className="space-y-0.5 text-right">
          <div className="text-xs text-neutral-500">已投完</div>
          <div className="text-sm font-semibold text-neutral-700">
            {finalizedCount} / {capacity}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {submissions.map((sub) => {
          const isSelf = sub.playerId === myUid;
          const myPoints = allocations[sub.playerId] ?? 0;
          return (
            <RestaurantCard
              key={sub.playerId}
              submission={sub}
              isSelf={isSelf}
              myPoints={myPoints}
              canIncrement={remaining > 0}
              disabled={finalized}
              onCardClick={() => setOpened(sub)}
              onIncrement={() => handleDelta(sub.playerId, +1)}
              onDecrement={() => handleDelta(sub.playerId, -1)}
            />
          );
        })}
      </div>

      <Button
        className="w-full h-11 bg-rose-600 hover:bg-rose-700"
        onClick={handleFinalize}
        disabled={finalizing || finalized || remaining > 0}
      >
        {finalizing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            送出中...
          </>
        ) : finalized ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            已投完，等其他人
          </>
        ) : remaining > 0 ? (
          `還有 ${remaining} 點沒投`
        ) : (
          "投完了"
        )}
      </Button>

      <RestaurantDialog
        submission={opened}
        isSelf={opened?.playerId === myUid}
        myPoints={opened ? allocations[opened.playerId] ?? 0 : 0}
        onOpenChange={(open) => !open && setOpened(null)}
      />
    </div>
  );
};
