/**
 * App clock. Demo deployments can set NEXT_PUBLIC_DEMO_TIME="19:40" so the
 * restaurant always looks mid dinner service (open status, ticket times,
 * seeded orders), whatever time zone the viewer is in. The offset is fixed
 * when the module loads, so demo time keeps ticking normally afterwards.
 * Leave it unset for a real restaurant.
 */
const DEMO_TIME = process.env.NEXT_PUBLIC_DEMO_TIME;

function minutesInNewYork(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

const OFFSET_MS = (() => {
  const match = DEMO_TIME?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  const target = Number(match[1]) * 60 + Number(match[2]);
  return (target - minutesInNewYork(new Date())) * 60_000;
})();

export function now() {
  return Date.now() + OFFSET_MS;
}

export function nowDate() {
  return new Date(now());
}
