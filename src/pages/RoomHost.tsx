import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, Flame, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  subscribePlayers,
  subscribeRoom,
  subscribeSubmissions,
} from "@/lib/rooms";
import { CITY_LABEL, type Player, type Room, type Submission } from "@/lib/types";

const RoomHost = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const personalUrl = (playerId: string) =>
    `${window.location.origin}/room/${roomId}/p/${playerId}`;

  const copy = async (playerId: string) => {
    await navigator.clipboard.writeText(personalUrl(playerId));
    setCopiedId(playerId);
    setTimeout(() => setCopiedId((curr) => (curr === playerId ? null : curr)), 1500);
  };

  const copyAll = async () => {
    const lines = players.map(
      (p, i) => `${i + 1}. ${personalUrl(p.id)}`,
    );
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "全部 URL 已複製" });
  };

  const joinedCount = useMemo(
    () => players.filter((p) => p.joinedAt).length,
    [players],
  );

  const submittedCount = submissions.length;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-2">
            <h1 className="text-xl font-bold">找不到房間</h1>
            <p className="text-sm text-neutral-600">這個房間不存在或已被刪除</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-white/95 backdrop-blur-sm border border-rose-200 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-orange-600 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-neutral-900">房間管理</h1>
                <p className="text-xs text-neutral-500 font-mono">{room.id}</p>
              </div>
              <Badge
                variant={room.status === "drawn" ? "default" : "secondary"}
                className={room.status === "drawn" ? "bg-rose-600" : ""}
              >
                {room.status === "drawn" ? "已抽卡" : "等待中"}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-rose-600">
                  {joinedCount} / {room.capacity}
                </div>
                <div className="text-xs text-neutral-500">已加入</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {submittedCount} / {room.capacity}
                </div>
                <div className="text-xs text-neutral-500">已提交餐廳</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">個人 URL</h2>
                <Button size="sm" variant="outline" onClick={copyAll}>
                  全部複製
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                把每條 URL 分別發給一位參與者。換裝置只要重新打開這條網址即可。
              </p>

              <ul className="space-y-2">
                {players.map((p, idx) => {
                  const joined = !!p.joinedAt;
                  const submitted = submissions.some((s) => s.playerId === p.id);
                  const assignedCity = room.assignments?.[p.id];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 bg-white"
                    >
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-600 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {p.name ?? <span className="text-neutral-400">未加入</span>}
                          </span>
                          {joined && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              已加入
                            </Badge>
                          )}
                          {submitted && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600">
                              已提交
                            </Badge>
                          )}
                          {assignedCity && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {CITY_LABEL[assignedCity]}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono truncate">
                          {personalUrl(p.id)}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copy(p.id)}
                        className="shrink-0"
                      >
                        {copiedId === p.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomHost;
