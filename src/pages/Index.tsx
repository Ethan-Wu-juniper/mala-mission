import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createRoom } from "@/lib/rooms";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [capacity, setCapacity] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    if (capacity < 2 || capacity > 20) {
      toast({ title: "人數請填 2 ~ 20 之間", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { roomId } = await createRoom(capacity, user.uid);
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast({
        title: "建房失敗",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-neutral-900">開一個房間</h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              朋友會被隨機分到「四川」或「重慶」，
              <br />
              各自挑一間餐廳推薦
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="capacity" className="text-neutral-700">
              參與人數
            </Label>
            <Input
              id="capacity"
              type="number"
              min={2}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              disabled={loading}
              className="h-12 text-lg"
            />
            <p className="text-xs text-neutral-500">
              建房後把房間連結分享給朋友，所有人到齊會自動抽卡
            </p>
          </div>

          <Button
            className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-base"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                建立中...
              </>
            ) : (
              "建立房間"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
