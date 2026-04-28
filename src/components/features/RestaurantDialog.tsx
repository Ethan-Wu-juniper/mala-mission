import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ExternalLink, CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RestaurantCard } from "@/components/features/RestaurantCard";
import { cn } from "@/lib/utils";
import type { Player, Submission } from "@/lib/types";

export interface GuessLine {
  voterName: string;
  guessedName: string;
}

interface Props {
  submission: Submission | null;
  isSelf: boolean;
  myPoints: number;
  maxStars: number;
  remaining: number;
  disabled: boolean;
  totalPoints?: number;
  isHost?: boolean;
  // voting mode
  players?: Player[];
  myGuess?: string | null;
  onGuessChange?: (guessedUid: string | null) => void;
  // results mode
  guessLines?: GuessLine[];
  onSetPoints: (points: number) => void;
  onOpenChange: (open: boolean) => void;
  onScheduleSet?: (playerId: string, isoString: string) => void;
}

function buildGoogleCalendarUrl(submission: Submission): string {
  const start = new Date(submission.scheduledAt!);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: submission.restaurantName,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (submission.mapsUrl) params.set("location", submission.mapsUrl);
  if (submission.dish) params.set("details", submission.dish);
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const iconBtnClass =
  "w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center transition hover:shadow-xl hover:scale-105 active:scale-95";

export const RestaurantDialog = ({
  submission,
  isSelf,
  myPoints,
  maxStars,
  remaining,
  disabled,
  totalPoints,
  isHost,
  players,
  myGuess,
  onGuessChange,
  guessLines,
  onSetPoints,
  onOpenChange,
  onScheduleSet,
}: Props) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<string | undefined>(
    submission?.scheduledAt,
  );

  const effectiveSchedule = localSchedule ?? submission?.scheduledAt;
  const parsed = effectiveSchedule ? new Date(effectiveSchedule) : null;
  const [date, setDate] = useState<Date | undefined>(parsed ?? undefined);
  const [hour, setHour] = useState(parsed ? String(parsed.getHours()).padStart(2, "0") : "12");
  const [minute, setMinute] = useState(parsed ? String(parsed.getMinutes()).padStart(2, "0") : "00");

  useEffect(() => {
    setLocalSchedule(submission?.scheduledAt);
    const p = submission?.scheduledAt ? new Date(submission.scheduledAt) : null;
    setDate(p ?? undefined);
    setHour(p ? String(p.getHours()).padStart(2, "0") : "12");
    setMinute(p ? String(p.getMinutes()).padStart(2, "0") : "00");
  }, [submission?.scheduledAt, submission?.playerId]);

  const calendarUrl = useMemo(
    () => (effectiveSchedule ? buildGoogleCalendarUrl({ ...submission!, scheduledAt: effectiveSchedule }) : null),
    [effectiveSchedule, submission],
  );

  const hasSchedule = !!effectiveSchedule;

  const handleScheduleConfirm = () => {
    if (!date || !submission || !onScheduleSet) return;
    const d = new Date(date);
    d.setHours(Number(hour), Number(minute), 0, 0);
    const iso = d.toISOString();
    setLocalSchedule(iso);
    onScheduleSet(submission.playerId, iso);
    setScheduleOpen(false);
  };

  const scheduleLabel = hasSchedule
    ? format(new Date(effectiveSchedule!), "M/d (EEE) HH:mm", { locale: zhTW })
    : "尚未設定時間";

  return (
    <Dialog open={!!submission} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] sm:max-w-[340px] p-0 bg-transparent border-0 shadow-none gap-0 [&>button]:hidden">
        {submission && (
          <div className="space-y-3">
            <RestaurantCard
              submission={submission}
              isSelf={isSelf}
              myPoints={myPoints}
              maxStars={maxStars}
              remaining={remaining}
              disabled={disabled}
              totalPoints={totalPoints}
              onCardClick={() => {}}
              onSetPoints={onSetPoints}
            />

            <div className="flex items-center justify-evenly mt-1">
              <TooltipProvider delayDuration={200}>
                {/* Google Maps */}
                {submission.mapsUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={submission.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconBtnClass}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-5 h-5 text-neutral-700" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>在 Google Maps 開啟</TooltipContent>
                  </Tooltip>
                )}

                {/* Schedule (host only) */}
                {isHost && onScheduleSet && (
                  <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(iconBtnClass, hasSchedule && "ring-2 ring-rose-400")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CalendarIcon className="w-5 h-5 text-neutral-700" />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{hasSchedule ? scheduleLabel : "設定用餐時間"}</TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-auto p-0" align="center" onClick={(e) => e.stopPropagation()}>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                      <div className="flex items-center gap-1 px-3 pb-3">
                        <Select value={hour} onValueChange={setHour}>
                          <SelectTrigger className="w-14 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-neutral-400 font-bold">:</span>
                        <Select value={minute} onValueChange={setMinute}>
                          <SelectTrigger className="w-14 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MINUTES.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="ml-auto h-8 px-2.5 text-xs" onClick={handleScheduleConfirm} disabled={!date}>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          確認
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Google Calendar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    {calendarUrl ? (
                      <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconBtnClass}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CalendarPlus className="w-5 h-5 text-neutral-700" />
                      </a>
                    ) : (
                      <span
                        className={cn(iconBtnClass, "opacity-35 cursor-not-allowed")}
                      >
                        <CalendarPlus className="w-5 h-5 text-neutral-400" />
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasSchedule ? "加到 Google 日曆" : "尚未設定用餐時間"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {hasSchedule && (
              <p className="text-center text-xs text-white/80 drop-shadow">
                {scheduleLabel}
              </p>
            )}

            {/* Voting: guess who selected this restaurant */}
            {!disabled && !isSelf && players && onGuessChange && (
              <div className="bg-white/90 rounded-xl px-3 py-2.5 space-y-1.5">
                <p className="text-xs text-neutral-500">你認為這是誰選的？</p>
                <Select
                  value={myGuess ?? ""}
                  onValueChange={(v) => onGuessChange(v || null)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="選一個人..." />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.displayName ?? p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Results: show everyone's guesses */}
            {disabled && guessLines && guessLines.length > 0 && (
              <div className="space-y-0.5 px-1">
                {guessLines.map((g, i) => (
                  <p key={i} className="text-[10px] text-neutral-400 text-center leading-relaxed">
                    {g.voterName} 認為是 {g.guessedName} 選的
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
