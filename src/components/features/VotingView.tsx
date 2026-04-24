import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import { RestaurantDialog } from "@/components/features/RestaurantDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Player, Submission, Vote } from "@/lib/types";

function useCountdown(targetIso: string | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  if (!targetIso) return null;
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d} 天 ${h} 時 ${m} 分`;
  if (h > 0) return `${h} 時 ${m} 分 ${s} 秒`;
  return `${m} 分 ${s} 秒`;
}

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

  const nextUpIndex = useMemo(() => {
    const now = Date.now();
    let closest = -1;
    let closestTime = Infinity;
    submissions.forEach((sub, i) => {
      if (!sub.scheduledAt) return;
      const t = new Date(sub.scheduledAt).getTime();
      if (t >= now && t < closestTime) {
        closest = i;
        closestTime = t;
      }
    });
    return closest;
  }, [submissions]);

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setActiveIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  const carouselInitialized = useRef(false);

  useEffect(() => {
    if (!carouselApi) return;
    if (!carouselInitialized.current && nextUpIndex >= 0) {
      carouselApi.scrollTo(nextUpIndex, true);
      carouselInitialized.current = true;
    }
    onSelect();
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi, onSelect, nextUpIndex]);

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

  const nextUpSub = nextUpIndex >= 0 ? submissions[nextUpIndex] : null;
  const countdown = useCountdown(nextUpSub?.scheduledAt);

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

      {nextUpSub && countdown && (
        <div className="flex items-center justify-center gap-2 py-3 bg-amber-50/80 border-b border-amber-200/60">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            <span className="font-semibold">{nextUpSub.restaurantName}</span>
            {" — "}
            {format(new Date(nextUpSub.scheduledAt!), "M/d (EEE) HH:mm", { locale: zhTW })}
            ，還有 <span className="font-bold tabular-nums">{countdown}</span>
          </span>
        </div>
      )}

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
              {submissions.map((sub, i) => (
                <div
                  key={sub.playerId}
                  className={cn(
                    "rounded-2xl transition-shadow duration-300",
                    i === nextUpIndex && "ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
                  )}
                >
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
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 pb-5 bg-gradient-to-t from-rose-50 via-rose-50/95 to-transparent pointer-events-none z-20">
        <div className="max-w-xl mx-auto pointer-events-auto">
          {finalized ? (
            <Button
              variant="outline"
              className="w-full h-12 shadow-lg text-base font-semibold border-rose-200"
              onClick={() => void onUpdateVote(allocations)}
            >
              <Check className="w-4 h-4 mr-2 text-emerald-600" />
              已確認，點此反悔
            </Button>
          ) : (
            <Button
              className="w-full h-12 bg-rose-600 hover:bg-rose-700 shadow-lg text-base font-semibold"
              onClick={handleFinalize}
              disabled={finalizing || remaining > 0}
            >
              {finalizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  送出中...
                </>
              ) : remaining > 0 ? (
                `還有 ${remaining} 點沒投`
              ) : (
                "確認送出"
              )}
            </Button>
          )}
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
