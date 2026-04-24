import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CITY_LABEL, type City } from "@/lib/types";

export interface RestaurantFormValues {
  restaurantName: string;
  dish: string;
  reason: string;
  mapsUrl: string;
}

interface Props {
  city: City;
  submitting: boolean;
  onSubmit: (values: RestaurantFormValues) => void;
}

export const RestaurantForm = ({ city, submitting, onSubmit }: Props) => {
  const [values, setValues] = useState<RestaurantFormValues>({
    restaurantName: "",
    dish: "",
    reason: "",
    mapsUrl: "",
  });

  const update = (key: keyof RestaurantFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.restaurantName.trim() || !values.reason.trim()) return;
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
        <Label htmlFor="dish">推薦菜色</Label>
        <Input
          id="dish"
          value={values.dish}
          onChange={update("dish")}
          placeholder="例：麻婆豆腐、夫妻肺片"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">推薦理由 *</Label>
        <Textarea
          id="reason"
          value={values.reason}
          onChange={update("reason")}
          placeholder="為什麼想去？"
          rows={4}
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mapsUrl">Google Maps 連結（選填）</Label>
        <Input
          id="mapsUrl"
          type="url"
          value={values.mapsUrl}
          onChange={update("mapsUrl")}
          placeholder="https://maps.app.goo.gl/..."
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
