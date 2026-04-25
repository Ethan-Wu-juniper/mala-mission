import { useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CITY_LABEL, type City } from "@/lib/types";

const HELP_STEPS = [
  { tab: "1", title: "找到地點", description: "打開 Google Maps，搜尋並找到該餐廳的地點。" },
  { tab: "2", title: "點擊分享", description: "點擊餐廳資訊面板上的「分享」按鈕。" },
  { tab: "3", title: "複製連結", description: "在彈出的分享選單中，點擊「複製連結」即可。" },
] as const;

const MapsHelpDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="text-neutral-400 hover:text-neutral-600 transition">
        <HelpCircle className="w-4 h-4" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>如何取得 Google Maps 連結</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="1" className="mt-2">
        <TabsList className="w-full">
          {HELP_STEPS.map((s) => (
            <TabsTrigger key={s.tab} value={s.tab} className="flex-1">
              步驟 {s.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {HELP_STEPS.map((s) => (
          <TabsContent key={s.tab} value={s.tab} className="space-y-3 pt-2">
            <img
              src={`/help/step-${s.tab}.png`}
              alt={`步驟 ${s.tab}: ${s.title}`}
              className="rounded-lg border border-neutral-200 w-full"
            />
            <p className="text-sm text-neutral-700">
              <span className="font-semibold">{s.title}</span>
              {" — "}
              {s.description}
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </DialogContent>
  </Dialog>
);

export interface RestaurantFormValues {
  restaurantName: string;
  dish: string;
  mapsUrl: string;
}

interface Props {
  city: City;
  submitting: boolean;
  onSubmit: (values: RestaurantFormValues) => void;
}

const MAPS_DOMAINS = [
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "www.google.com",
  "google.com",
];

function validateMapsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "請輸入有效的網址";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "請輸入有效的網址";
  }
  const isGoogleMaps =
    MAPS_DOMAINS.some((d) => url.hostname === d) &&
    (url.hostname !== "www.google.com" && url.hostname !== "google.com"
      ? true
      : url.pathname.startsWith("/maps"));
  if (!isGoogleMaps) {
    return "請輸入 Google Maps 連結";
  }
  return null;
}

export const RestaurantForm = ({ city, submitting, onSubmit }: Props) => {
  const [values, setValues] = useState<RestaurantFormValues>({
    restaurantName: "",
    dish: "",
    mapsUrl: "",
  });
  const [mapsError, setMapsError] = useState<string | null>(null);

  const update = (key: keyof RestaurantFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      if (key === "mapsUrl") setMapsError(null);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.restaurantName.trim()) return;
    const urlError = validateMapsUrl(values.mapsUrl.trim());
    if (urlError) {
      setMapsError(urlError);
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-neutral-600">
        在 <span className="font-bold text-rose-600">{CITY_LABEL[city]}</span>{" "}
        範圍內找一間餐廳推薦給大家。
      </div>

      <div className="space-y-2">
        <Label htmlFor="restaurantName">餐廳名稱 *</Label>
        <Input
          id="restaurantName"
          value={values.restaurantName}
          onChange={update("restaurantName")}
          placeholder="例：陳麻婆豆腐"
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="mapsUrl">Google Maps 連結 *</Label>
          <MapsHelpDialog />
        </div>
        <Input
          id="mapsUrl"
          value={values.mapsUrl}
          onChange={update("mapsUrl")}
          placeholder="https://maps.app.goo.gl/..."
          disabled={submitting}
          className={mapsError ? "border-rose-500 focus-visible:ring-rose-500" : ""}
        />
        {mapsError && (
          <p className="text-xs text-rose-500">{mapsError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dish">推薦菜色（選填）</Label>
        <Input
          id="dish"
          value={values.dish}
          onChange={update("dish")}
          placeholder="例：麻婆豆腐、夫妻肺片"
          disabled={submitting}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-rose-600 hover:bg-rose-700"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            提交中...
          </>
        ) : (
          "提交餐廳"
        )}
      </Button>
    </form>
  );
};
