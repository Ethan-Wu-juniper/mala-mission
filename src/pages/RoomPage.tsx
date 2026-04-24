import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Loader2,
  LogOut,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CityCard } from "@/components/features/CityCard";
import { VotingView } from "@/components/features/VotingView";
import { ResultsView } from "@/components/features/ResultsView";
import {
  RestaurantForm,
  type RestaurantFormValues,
} from "@/components/forms/RestaurantForm";
import {
  finalizeVote,
  joinRoom,
  setMyVote,
  submitRestaurant,
  subscribePlayers,
  subscribeRoom,
  subscribeSubmissions,
  subscribeVotes,
} from "@/lib/rooms";
import type { Player, Room, Submission, Vote } from "@/lib/types";

const Shell = ({
  children,
  narrow = true,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) => {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-rose-100/60 bg-white/40 backdrop-blur-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gradient-to-br from-rose-600 to-orange-600 rounded-md flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">麻辣任務</span>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-600 hidden sm:inline">
            {user?.displayName ?? user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-neutral-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1">
        {narrow ? (
          <div className="max-w-xl mx-auto px-6 py-10">{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};

const CenterMessage = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="text-center py-16 space-y-2">
    <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
    {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
  </div>
);

const NicknameBadge = ({ name }: { name: string }) => (
  <div className="text-center space-y-2">
    <div className="text-xs text-neutral-500">你是</div>
    <Badge className="text-sm px-3 py-1 bg-rose-600 hover:bg-rose-600">
      {name}
    </Badge>
  </div>
);

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoJoined = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    const unsubRoom = subscribeRoom(roomId, (r) => {
      setRoom(r);
      setLoaded(true);
    });
    const unsubPlayers = subscribePlayers(roomId, setPlayers);
    const unsubSubs = subscribeSubmissions(roomId, setSubmissions);
    const unsubVotes = subscribeVotes(roomId, setVotes);
    return () => {
      unsubRoom();
      unsubPlayers();
      unsubSubs();
      unsubVotes();
    };
  }, [roomId]);

  const me = useMemo(
    () => players.find((p) => p.id === user?.uid) ?? null,
    [players, user?.uid],
  );
  const mySubmission = useMemo(
    () => submissions.find((s) => s.playerId === user?.uid) ?? null,
    [submissions, user?.uid],
  );
  const myVote = useMemo(
    () => votes.find((v) => v.voterUid === user?.uid) ?? null,
    [votes, user?.uid],
  );
  const joinedCount = room?.joinedUids.length ?? 0;
  const isFull = room ? joinedCount >= room.capacity : false;
  const myCity = room?.assignments?.[user?.uid ?? ""] ?? null;
  const allSubmitted = room ? submissions.length >= room.capacity : false;
  const finalizedVotes = votes.filter((v) => v.finalized);
  const allFinalized = room ? finalizedVotes.length >= room.capacity : false;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJoin = async () => {
    if (!user || !roomId) return;
    setJoining(true);
    try {
      await joinRoom(roomId, user.uid);
    } catch (err) {
      toast({
        title: "加入失敗",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (!loaded) {
    return (
      <Shell>
        <div className="flex justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      </Shell>
    );
  }

  if (!room) {
    return (
      <Shell>
        <CenterMessage title="找不到房間" subtitle="這個房間不存在或已被刪除" />
      </Shell>
    );
  }

  if (!me) {
    if (isFull) {
      return (
        <Shell>
          <CenterMessage title="房間已滿" subtitle={`已經有 ${room.capacity} 人在裡面了`} />
        </Shell>
      );
    }
    if (!autoJoined.current && !joining) {
      autoJoined.current = true;
      handleJoin();
    }
    return (
      <Shell>
        <div className="py-16 text-center space-y-6">
          <UserPlus className="w-12 h-12 text-rose-600 mx-auto" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-900">加入房間</h1>
            <p className="text-sm text-neutral-600">
              目前 {joinedCount} / {room.capacity} 人
            </p>
          </div>
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                加入中...
              </>
            ) : (
              "加入"
            )}
          </Button>
        </div>
      </Shell>
    );
  }

  const nickname = me.name ?? "";
  const budget = 3;

  // Results phase
  if (allSubmitted && allFinalized && user) {
    return (
      <Shell>
        <ResultsView
          submissions={submissions}
          votes={votes}
          myUid={user.uid}
        />
      </Shell>
    );
  }

  // Voting phase
  if (allSubmitted && user) {
    return (
      <Shell narrow={false}>
        <VotingView
          submissions={submissions}
          myUid={user.uid}
          budget={budget}
          myVote={myVote}
          finalizedCount={finalizedVotes.length}
          capacity={room.capacity}
          onUpdateVote={(a) => setMyVote(roomId!, user.uid, a)}
          onFinalize={(a) => finalizeVote(roomId!, user.uid, a)}
        />
      </Shell>
    );
  }

  // I submitted, waiting for others
  if (mySubmission) {
    return (
      <Shell>
        <div className="py-10 space-y-8 text-center">
          <NicknameBadge name={nickname} />
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-neutral-900">已提交餐廳</h1>
            <p className="text-sm text-neutral-600">
              你推薦了《{mySubmission.restaurantName}》
            </p>
          </div>
          <Separator />
          <div className="text-sm text-neutral-500">
            等其他人提交... {submissions.length} / {room.capacity}
          </div>
        </div>
      </Shell>
    );
  }

  // Drawn → flip card → form
  if (room.status === "drawn" && myCity) {
    const handleSubmit = async (values: RestaurantFormValues) => {
      if (!user) return;
      setSubmitting(true);
      try {
        await submitRestaurant(roomId!, user.uid, {
          city: myCity,
          restaurantName: values.restaurantName.trim(),
          dish: values.dish.trim(),
          mapsUrl: values.mapsUrl.trim(),
        });
      } catch (err) {
        toast({
          title: "提交失敗",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Shell>
        <div className="py-6 space-y-8">
          <NicknameBadge name={nickname} />
          {!revealed ? (
            <div className="space-y-4">
              <div className="text-center text-sm text-neutral-600">
                全員到齊，點擊卡牌揭曉你的城市
              </div>
              <CityCard city={myCity} onContinue={() => setRevealed(true)} />
            </div>
          ) : (
            <RestaurantForm
              city={myCity}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </Shell>
    );
  }

  // Joined, waiting for others to join
  return (
    <Shell>
      <div className="py-10 space-y-10">
        <NicknameBadge name={nickname} />

        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-rose-600">
            {joinedCount} <span className="text-neutral-400">/ {room.capacity}</span>
          </div>
          <div className="text-sm text-neutral-500">人已加入</div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-medium text-neutral-700">邀請朋友</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs text-neutral-500 font-mono truncate px-3 py-2 rounded-md bg-white/60 border border-neutral-200">
              {window.location.href}
            </div>
            <Button size="sm" variant="outline" onClick={copyShareLink}>
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            把這個連結傳給朋友，他們登入後可加入。滿員自動抽卡。
          </p>
        </div>

        {players.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="text-sm font-medium text-neutral-700">
                已加入 ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="text-xs px-2.5 py-1"
                  >
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
};

export default RoomPage;
