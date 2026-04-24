import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { RestaurantDialog } from "@/components/features/RestaurantDialog";
import { cn } from "@/lib/utils";
import type { Player, Submission, Vote } from "@/lib/types";

interface Props {
  submissions: Submission[];
  votes: Vote[];
  players: Player[];
  myUid: string;
  hostUid: string;
  onScheduleSet: (playerId: string, isoString: string) => Promise<void>;
}

interface RankedEntry {
  submission: Submission;
  total: number;
  rank: number;
}

const FALLBACK_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500",
  "bg-emerald-500", "bg-cyan-500", "bg-violet-500",
];

const Avatar = ({
  playerId,
  playerName,
  photoURL,
  size = "md",
  onClick,
}: {
  playerId: string;
  playerName: string | null;
  photoURL: string | null;
  size?: "sm" | "md" | "lg";
  onClick: () => void;
}) => {
  const sizeClass = size === "lg" ? "w-20 h-20 text-2xl" : size === "md" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  const colorIndex = playerId.charCodeAt(0) % FALLBACK_COLORS.length;
  const fallbackColor = FALLBACK_COLORS[colorIndex];
  const initial = (playerName ?? "?")[0].toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 overflow-hidden",
        "shadow-lg ring-2 ring-white",
        "hover:scale-105 transition-transform active:scale-95",
        sizeClass,
        !photoURL && fallbackColor,
      )}
    >
      {photoURL ? (
        <img src={photoURL} alt={playerName ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold">{initial}</span>
      )}
    </button>
  );
};

const PodiumBlock = ({
  rank,
  entries,
  height,
  color,
  playerMap,
  onOpen,
}: {
  rank: number;
  entries: RankedEntry[];
  height: string;
  color: string;
  playerMap: Map<string, Player>;
  onOpen: (s: Submission) => void;
}) => (
  <div className="flex flex-col items-center">
    <div className="flex flex-wrap justify-center gap-2 mb-3 max-w-[160px]">
      {entries.map(({ submission, total }) => {
        const player = playerMap.get(submission.playerId);
        return (
          <div key={submission.playerId} className="flex flex-col items-center gap-1">
            <Avatar
              playerId={submission.playerId}
              playerName={player?.name ?? submission.restaurantName}
              photoURL={player?.photoURL ?? null}
              size={rank === 1 ? "lg" : "md"}
              onClick={() => onOpen(submission)}
            />
            <span className="text-[11px] text-neutral-500 font-medium">★ {total}</span>
            <span className="text-[10px] text-neutral-400 max-w-[72px] text-center line-clamp-1">
              {submission.restaurantName}
            </span>
          </div>
        );
      })}
    </div>

    <div className={cn("w-28 rounded-t-xl flex items-center justify-center", height, color)}>
      <span className={cn("font-black text-white drop-shadow", rank === 1 ? "text-4xl" : "text-2xl")}>
        {rank}
      </span>
    </div>
  </div>
);

export const ResultsView = ({ submissions, votes, players, myUid, hostUid, onScheduleSet }: Props) => {
  const [opened, setOpened] = useState<Submission | null>(null);

  const ranked = useMemo<RankedEntry[]>(() => {
    const totals: Record<string, number> = {};
    for (const v of votes) {
      for (const [recipient, pts] of Object.entries(v.allocations)) {
        totals[recipient] = (totals[recipient] ?? 0) + pts;
      }
    }
    const sorted = [...submissions]
      .map((s) => ({ submission: s, total: totals[s.playerId] ?? 0 }))
      .sort((a, b) => b.total - a.total);

    let currentRank = 1;
    return sorted.map((entry, i) => {
      if (i > 0 && entry.total < sorted[i - 1].total) currentRank = i + 1;
      return { ...entry, rank: currentRank };
    });
  }, [submissions, votes]);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const byRank = useMemo(() => {
    const map = new Map<number, RankedEntry[]>();
    for (const entry of ranked) {
      const arr = map.get(entry.rank) ?? [];
      arr.push(entry);
      map.set(entry.rank, arr);
    }
    return map;
  }, [ranked]);

  const podiumRanks = [1, 2, 3].filter((r) => byRank.has(r));
  const others = ranked.filter((e) => e.rank > 3);

  const podiumConfig: Record<number, { height: string; color: string }> = {
    1: { height: "h-28", color: "bg-gradient-to-b from-amber-400 to-amber-500" },
    2: { height: "h-20", color: "bg-gradient-to-b from-slate-300 to-slate-400" },
    3: { height: "h-14", color: "bg-gradient-to-b from-orange-300 to-orange-400" },
  };

  // display order: 2nd left, 1st center, 3rd right
  const podiumOrder = [2, 1, 3].filter((r) => byRank.has(r));

  const openedRanked = opened
    ? ranked.find((r) => r.submission.playerId === opened.playerId)
    : null;

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-neutral-900">投票結果</h1>
      </div>

      {/* podium */}
      {podiumRanks.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-end justify-center gap-1">
            {podiumOrder.map((rank) => (
              <PodiumBlock
                key={rank}
                rank={rank}
                entries={byRank.get(rank)!}
                height={podiumConfig[rank].height}
                color={podiumConfig[rank].color}
                playerMap={playerMap}
                onOpen={setOpened}
              />
            ))}
          </div>
          {/* base */}
          <div className="h-3 mx-auto w-[calc(3*6rem+2*0.25rem)] bg-gradient-to-b from-neutral-300 to-neutral-400 rounded-b-lg" />
        </div>
      )}

      {/* others below stage */}
      {others.length > 0 && (
        <div className="flex flex-wrap justify-center gap-5 pt-2">
          {others.map(({ submission, total, rank }) => {
            const player = playerMap.get(submission.playerId);
            return (
              <div key={submission.playerId} className="flex flex-col items-center gap-1">
                <span className="text-[11px] text-neutral-400 font-medium">#{rank}</span>
                <Avatar
                  playerId={submission.playerId}
                  playerName={player?.name ?? submission.restaurantName}
                  photoURL={player?.photoURL ?? null}
                  size="sm"
                  onClick={() => setOpened(submission)}
                />
                <span className="text-[10px] text-neutral-500 text-center max-w-[64px] line-clamp-2 leading-tight">
                  {submission.restaurantName}
                </span>
                <span className="text-[10px] text-neutral-400">★ {total}</span>
              </div>
            );
          })}
        </div>
      )}

      {ranked.length === 0 && (
        <p className="text-center text-sm text-neutral-500">大家都沒投票欸</p>
      )}

      <RestaurantDialog
        submission={opened}
        isSelf={opened?.playerId === myUid}
        myPoints={0}
        maxStars={3}
        remaining={0}
        disabled
        totalPoints={openedRanked?.total}
        isHost={myUid === hostUid}
        onSetPoints={() => {}}
        onOpenChange={(open) => !open && setOpened(null)}
        onScheduleSet={onScheduleSet}
      />
    </div>
  );
};
