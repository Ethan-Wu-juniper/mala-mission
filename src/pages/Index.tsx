import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createRoom, listMyRooms } from "@/lib/rooms";
import type { Room } from "@/lib/types";

const statusLabel = (status: Room["status"], joined: number, capacity: number) => {
  if (status === "drawn") return "已抽卡";
  return `等待中 ${joined}/${capacity}`;
};

const formatDate = (room: Room) => {
  const ts = room.createdAt?.toDate?.();
  if (!ts) return "";
  const now = new Date();
  const isToday =
    ts.getFullYear() === now.getFullYear() &&
    ts.getMonth() === now.getMonth() &&
    ts.getDate() === now.getDate();
  if (isToday) {
    return ts.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return ts.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [creating, setCreating] = useState(false);
  const [myRooms, setMyRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyRooms(user.uid)
      .then(setMyRooms)
      .catch((err) => {
        toast({
          title: "載入房間列表失敗",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
        setMyRooms([]);
      });
  }, [user, toast]);

  const handleCreate = async () => {
    if (!user) return;
    if (capacity < 2 || capacity > 12) {
      toast({ title: "人數請填 2 ~ 12 之間", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { roomId } = await createRoom(capacity, user.uid, user.photoURL, title.trim());
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast({
        title: "建房失敗",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-rose-100/60 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-600 to-orange-600 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-neutral-900">麻辣任務</span>
        </div>
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

      <main className="flex-1 px-6 py-10">
        <div className="max-w-md mx-auto space-y-12">
          <section className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">開一個房間</h1>
              <p className="text-sm text-neutral-600 leading-relaxed">
                朋友會被隨機分到「四川」或「重慶」，各自挑一間餐廳推薦
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="title" className="text-neutral-700">
                房間標題
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="例：週五聚餐"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="capacity" className="text-neutral-700">
                參與人數
              </Label>
              <Input
                id="capacity"
                type="number"
                min={2}
                max={12}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                disabled={creating}
                className="h-11"
              />
            </div>

            <Button
              className="w-full h-11 bg-rose-600 hover:bg-rose-700"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  建立中...
                </>
              ) : (
                "建立房間"
              )}
            </Button>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">我的房間</h2>
              {myRooms && (
                <span className="text-xs text-neutral-500">
                  {myRooms.length} 個
                </span>
              )}
            </div>

            {myRooms === null ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : myRooms.length === 0 ? (
              <div className="text-center py-10 text-sm text-neutral-500">
                還沒有參與過任何房間
              </div>
            ) : (
              <ul className="space-y-2">
                {myRooms.map((room) => {
                  const joined = room.joinedUids?.length ?? 0;
                  return (
                    <li key={room.id}>
                      <button
                        onClick={() => navigate(`/room/${room.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white border border-neutral-200 transition text-left"
                      >
                        <div className="w-9 h-9 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-rose-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-800 truncate">
                              {room.title || room.id}
                            </span>
                            <Badge
                              variant={
                                room.status === "drawn" ? "default" : "secondary"
                              }
                              className={
                                room.status === "drawn"
                                  ? "text-[10px] px-1.5 py-0 bg-rose-600"
                                  : "text-[10px] px-1.5 py-0"
                              }
                            >
                              {statusLabel(room.status, joined, room.capacity)}
                            </Badge>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {formatDate(room)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
