import { nowDate } from "@/lib/clock";
import { restaurant } from "@/lib/restaurant";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Day of week and minutes since midnight in the restaurant's time zone. */
export function localClock(date = nowDate()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: restaurant.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return { day: WEEKDAYS.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type OpenStatus =
  | { open: true; closesAt: string; closingSoon: boolean }
  | { open: false; opensAt: string; opensDay: number; opensToday: boolean };

export function openStatus(date = nowDate()): OpenStatus {
  const { day, minutes } = localClock(date);
  for (const slot of restaurant.hours[day]) {
    const start = toMinutes(slot.open);
    const end = toMinutes(slot.close);
    if (minutes >= start && minutes < end) return { open: true, closesAt: slot.close, closingSoon: end - minutes <= 45 };
  }
  const later = restaurant.hours[day].find((slot) => toMinutes(slot.open) > minutes);
  if (later) return { open: false, opensAt: later.open, opensDay: day, opensToday: true };
  for (let i = 1; i <= 7; i++) {
    const next = (day + i) % 7;
    const first = restaurant.hours[next][0];
    if (first) return { open: false, opensAt: first.open, opensDay: next, opensToday: false };
  }
  return { open: false, opensAt: "17:00", opensDay: day, opensToday: false };
}

/** "10:30 pm", "5 pm". */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}

export function formatSlots(day: number) {
  return restaurant.hours[day].map((s) => `${formatTime(s.open)} – ${formatTime(s.close)}`).join(" · ");
}
