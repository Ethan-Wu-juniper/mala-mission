import { Flame, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!user) {
    const handleSignIn = async () => {
      try {
        await signIn();
      } catch (err) {
        toast({
          title: "登入失敗",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        <div className="max-w-sm w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">麻辣任務</h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              先用 Google 登入，才能建房或加入房間
            </p>
          </div>

          <Button
            onClick={handleSignIn}
            className="w-full bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-300 shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 登入
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
