import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CityCard } from "@/components/features/CityCard";
import {
  RestaurantForm,
  type RestaurantFormValues,
} from "@/components/forms/RestaurantForm";
import {
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

const NicknameHeader = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center gap-2">
    <span className="text-xs text-neutral-500">你是</span>
    <Badge className="text-sm px-3 py-1 bg-rose-600 hover:bg-rose-600">
      {name}
    </Badge>
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
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const joinTriggered = useRef(false);

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

  useEffect(() => {
    if (!roomId || !playerId) return;
    if (!me || me.joinedAt) return;
    if (joinTriggered.current) return;
    joinTriggered.current = true;
    joinPlayer(roomId, playerId).catch((err) => {
      joinTriggered.current = false;
      toast({
        title: "加入失敗",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    });
  }, [roomId, playerId, me, toast]);

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

  const nickname = me.name ?? "";
  const myCity = room.assignments?.[playerId] ?? null;
  const joinedCount = room.joinedCount ?? 0;

  // Submitted → done
  if (mySubmission) {
    return (
      <Shell>
        <Card className="border-emerald-200 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <NicknameHeader name={nickname} />
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-bold">已提交，感謝你！</h1>
            <p className="text-sm text-neutral-600">
              你推薦了《{mySubmission.restaurantName}》
            </p>
            <Badge variant="secondary">
              目前 {submissions.length} / {room.capacity} 人已提交
            </Badge>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Drawn → flip card → form
  if (room.status === "drawn" && myCity) {
    const handleSubmit = async (values: RestaurantFormValues) => {
      setSubmitting(true);
      try {
        await submitRestaurant(roomId, playerId, {
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
        <Card className="border-rose-200 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <NicknameHeader name={nickname} />
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
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Joined, waiting for others
  return (
    <Shell>
      <Card className="border-rose-200 shadow-xl">
        <CardContent className="p-8 space-y-6 text-center">
          <NicknameHeader name={nickname} />
          <div className="space-y-2">
            <div className="text-3xl font-bold text-rose-600">
              {joinedCount} / {room.capacity}
            </div>
            <div className="text-sm text-neutral-500">人已加入</div>
          </div>
          <div className="text-sm text-neutral-500">
            等待其他人加入，滿員後會自動抽卡
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
};

export default PlayerRoom;
