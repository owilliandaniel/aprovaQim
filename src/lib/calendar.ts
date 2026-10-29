// Month view helpers on plain "YYYY-MM-DD" strings (UTC math, so no time zone drift).
const DAY_MS = 86_400_000;
const toIsoDate = (time: number) => new Date(time).toISOString().slice(0, 10);

// Every day shown in a month view: whole weeks, Sunday to Saturday.
export function calendarDays(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = Date.UTC(year, month - 1, 1 - leading);
  return Array.from({ length: Math.ceil((leading + length) / 7) * 7 }, (_, i) => toIsoDate(start + i * DAY_MS));
}

// "2026-10" moved by some months: ("2026-10", -1) -> "2026-09".
export function shiftMonth(yearMonth: string, months: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  return toIsoDate(Date.UTC(year, month - 1 + months, 1)).slice(0, 7);
}

// 0 = Sunday ... 6 = Saturday.
export function weekday(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}
