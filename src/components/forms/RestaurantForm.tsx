import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITY_LABEL, type City } from "@/lib/types";

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

function validateMapsUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    new URL(raw);
    return null;
  } catch {
    return "請輸入有效的網址";
  }
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
        <Label htmlFor="mapsUrl">地圖連結（選填）</Label>
        <Input
          id="mapsUrl"
          value={values.mapsUrl}
          onChange={update("mapsUrl")}
          placeholder="https://..."
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
