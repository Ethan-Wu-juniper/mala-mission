import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import { RestaurantDialog } from "@/components/features/RestaurantDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Player, Submission, Vote } from "@/lib/types";

interface Props {
  submissions: Submission[];
  players: Player[];
  myUid: string;
  hostUid: string;
  budget: number;
  myVote: Vote | null;
  finalizedCount: number;
  capacity: number;
  onUpdateVote: (allocations: Record<string, number>) => Promise<void>;
  onFinalize: (allocations: Record<string, number>) => Promise<void>;
  onScheduleSet: (playerId: string, isoString: string) => Promise<void>;
}

export const VotingView = ({
  submissions,
  players,
  myUid,
  hostUid,
  budget,
  myVote,
  finalizedCount,
  capacity,
  onUpdateVote,
  onFinalize,
  onScheduleSet,
}: Props) => {
  const [allocations, setAllocations] = useState<Record<string, number>>(
    myVote?.allocations ?? {},
  );
  const [opened, setOpened] = useState<Submission | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const initialized = useRef(false);
  const isMobile = useIsMobile();

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setActiveIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onSelect();
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi, onSelect]);

  useEffect(() => {
    if (initialized.current) return;
    if (myVote) {
      setAllocations(myVote.allocations);
      initialized.current = true;
    }
  }, [myVote]);

  const finalized = myVote?.finalized ?? false;

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const used = useMemo(
    () => Object.values(allocations).reduce((a, b) => a + b, 0),
    [allocations],
  );
  const remaining = budget - used;

  const handleSetPoints = (recipientUid: string, newPoints: number) => {
    if (newPoints < 0) return;
    const current = allocations[recipientUid] ?? 0;
    const delta = newPoints - current;
    if (delta > remaining) return;
    const next = { ...allocations };
    if (newPoints === 0) delete next[recipientUid];
    else next[recipientUid] = newPoints;
    setAllocations(next);
    void onUpdateVote(next);
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
    <div className="min-h-screen flex flex-col pb-28">
      <div className="sticky top-0 z-20 px-6 py-3 bg-gradient-to-b from-rose-50 via-rose-50/95 to-rose-50/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">投票</h1>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                已投完 {finalizedCount} / {capacity}
              </p>
            </div>
            <div className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.4)] ring-2 ring-amber-300/50">
              <Star
                className="w-4 h-4 fill-white text-white drop-shadow"
                strokeWidth={2}
              />
              <span className="text-lg font-black text-white leading-none tabular-nums">
                {remaining}
              </span>
              <span className="text-xs font-bold text-white/80 leading-none">
                /{budget}
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            點卡片右上角的星星投票，每顆星 1 點。所有點數投完才能送出，不能投給自己。
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {isMobile ? (
          <>
            <Carousel
              opts={{ align: "center", containScroll: false }}
              setApi={setCarouselApi}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {submissions.map((sub, i) => (
                  <CarouselItem key={sub.playerId} className="basis-[72%] pl-3">
                    <div className={cn(
                      "transition-all duration-300",
                      i !== activeIndex && "opacity-40 scale-[0.92]",
                    )}>
                      <RestaurantCard
                        submission={sub}
                        isSelf={sub.playerId === myUid}
                        myPoints={allocations[sub.playerId] ?? 0}
                        maxStars={budget}
                        remaining={remaining}
                        disabled={finalized}
                        playerName={playerMap.get(sub.playerId)?.name}
                        onCardClick={() => setOpened(sub)}
                        onSetPoints={(p) => handleSetPoints(sub.playerId, p)}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {submissions.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {submissions.map((sub, i) => (
                  <button
                    key={sub.playerId}
                    type="button"
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "w-2.5 h-2.5 bg-rose-500"
                        : "w-2 h-2 bg-neutral-300",
                    )}
                    onClick={() => carouselApi?.scrollTo(i)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full overflow-x-auto pb-2">
            <div className="flex flex-row gap-3 px-6 w-max mx-auto [&>*]:w-80">
              {submissions.map((sub) => (
                <RestaurantCard
                  key={sub.playerId}
                  submission={sub}
                  isSelf={sub.playerId === myUid}
                  myPoints={allocations[sub.playerId] ?? 0}
                  maxStars={budget}
                  remaining={remaining}
                  disabled={finalized}
                  playerName={playerMap.get(sub.playerId)?.name}
                  onCardClick={() => setOpened(sub)}
                  onSetPoints={(p) => handleSetPoints(sub.playerId, p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 pb-5 bg-gradient-to-t from-rose-50 via-rose-50/95 to-transparent pointer-events-none z-20">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <Button
            className="w-full h-12 bg-rose-600 hover:bg-rose-700 shadow-lg text-base font-semibold"
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
        </div>
      </div>

      <RestaurantDialog
        submission={opened}
        isSelf={opened?.playerId === myUid}
        myPoints={opened ? allocations[opened.playerId] ?? 0 : 0}
        maxStars={budget}
        remaining={remaining}
        disabled={finalized}
        isHost={myUid === hostUid}
        onSetPoints={(p) =>
          opened ? handleSetPoints(opened.playerId, p) : undefined
        }
        onOpenChange={(open) => !open && setOpened(null)}
        onScheduleSet={onScheduleSet}
      />
    </div>
  );
};
