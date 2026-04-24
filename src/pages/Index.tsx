import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createRoom } from "@/lib/rooms";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [capacity, setCapacity] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (capacity < 2 || capacity > 20) {
      toast({ title: "人數請填 2 ~ 20 之間", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { roomId } = await createRoom(capacity);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border border-rose-200 shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">麻辣任務</h1>
            <p className="text-neutral-600 leading-relaxed text-sm">
              開一個房間，每個人會被隨機分配「四川」或「重慶」，
              <br />
              在指定範圍內挑一間餐廳推薦給大家。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">參與人數</Label>
            <Input
              id="capacity"
              type="number"
              min={2}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              disabled={loading}
            />
            <p className="text-xs text-neutral-500">
              建房後會生成 {capacity} 條個人 URL，分別發給每個參與者
            </p>
          </div>

          <Button
            className="w-full bg-rose-600 hover:bg-rose-700"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
