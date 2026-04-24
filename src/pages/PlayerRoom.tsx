import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Flame, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CityCard } from "@/components/features/CityCard";
import {
  RestaurantForm,
  type RestaurantFormValues,
} from "@/components/forms/RestaurantForm";
import {
  drawCards,
  joinPlayer,
  submitRestaurant,
  subscribePlayers,
  subscribeRoom,
  subscribeSubmissions,
} from "@/lib/rooms";
import type { Player, Room, Submission } from "@/lib/types";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-10 px-4 flex items-start justify-center">
    <div className="w-full max-w-md">{children}</div>
  </div>
);

const PlayerRoom = () => {
  const { roomId, playerId } = useParams<{
    roomId: string;
    playerId: string;
  }>();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsubRoom = subscribeRoom(roomId, (r) => {
      setRoom(r);
      setLoaded(true);
    });
    const unsubPlayers = subscribePlayers(roomId, setPlayers);
    const unsubSubs = subscribeSubmissions(roomId, setSubmissions);
    return () => {
      unsubRoom();
      unsubPlayers();
      unsubSubs();
    };
  }, [roomId]);

  const me = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId],
  );
  const mySubmission = useMemo(
    () => submissions.find((s) => s.playerId === playerId) ?? null,
    [submissions, playerId],
  );
  const joinedCount = players.filter((p) => p.joinedAt).length;
  const allJoined = room ? joinedCount === room.capacity : false;
  const myCity = room?.assignments?.[playerId ?? ""] ?? null;

  if (!roomId || !playerId) return null;

  if (!loaded) {
    return (
      <Shell>
        <div className="flex justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      </Shell>
    );
  }

  if (!room || !me) {
    return (
      <Shell>
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <h1 className="text-xl font-bold">無效的網址</h1>
            <p className="text-sm text-neutral-600">
              這條個人 URL 不存在，請跟開房者重新確認
            </p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Step 1: not joined yet → name entry
  if (!me.joinedAt || !me.name) {
    const handleJoin = async () => {
      if (!name.trim()) {
        toast({ title: "請輸入名字", variant: "destructive" });
        return;
      }
      setJoining(true);
      try {
        await joinPlayer(roomId, playerId, name);
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

    return (
      <Shell>
        <Card className="border-rose-200 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">加入麻辣任務</h1>
              <p className="text-sm text-neutral-600">
                輸入你的名字，等所有人到齊後就可以抽卡
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">你的名字</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：小明"
                disabled={joining}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
              />
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加入中...
                </>
              ) : (
                "加入房間"
              )}
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Step 4: already submitted
  if (mySubmission) {
    const submittedCount = submissions.length;
    return (
      <Shell>
        <Card className="border-emerald-200 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-bold">已提交，感謝你！</h1>
            <p className="text-sm text-neutral-600">
              你推薦了《{mySubmission.restaurantName}》
            </p>
            <Badge variant="secondary">
              目前 {submittedCount} / {room.capacity} 人已提交
            </Badge>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Step 3: drawn → flip card → form
  if (room.status === "drawn" && myCity) {
    const handleSubmit = async (values: RestaurantFormValues) => {
      setSubmitting(true);
      try {
        await submitRestaurant(roomId, playerId, {
          city: myCity,
          restaurantName: values.restaurantName.trim(),
          dish: values.dish.trim(),
          reason: values.reason.trim(),
          mapsUrl: values.mapsUrl.trim() || null,
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
        <Card className="border-rose-200 shadow-xl">
          <CardContent className="p-8 space-y-6">
            {!revealed ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-neutral-600">
                  點擊卡牌揭曉你的城市
                </div>
                <CityCard city={myCity} onRevealed={() => setRevealed(true)} />
              </div>
            ) : (
              <RestaurantForm
                city={myCity}
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Step 2: joined, waiting for others / draw
  const handleDraw = async () => {
    setDrawing(true);
    try {
      await drawCards(roomId);
    } catch (err) {
      toast({
        title: "抽卡失敗",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setDrawing(false);
    }
  };

  return (
    <Shell>
      <Card className="border-rose-200 shadow-xl">
        <CardContent className="p-8 space-y-6 text-center">
          <div className="space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold">嗨，{me.name}！</h1>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-bold text-rose-600">
              {joinedCount} / {room.capacity}
            </div>
            <div className="text-sm text-neutral-500">人已加入</div>
          </div>

          {allJoined ? (
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleDraw}
              disabled={drawing}
            >
              {drawing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  抽卡中...
                </>
              ) : (
                "開始抽卡"
              )}
            </Button>
          ) : (
            <div className="text-sm text-neutral-500">
              等待其他人加入，這個頁面會即時更新
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
};

export default PlayerRoom;
