const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// "2026-11-04" -> "04 nov 2026"
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

// "2026-11-04" -> "4 de novembro de 2026"
export function formatDateLong(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${Number(day)} de ${MONTHS_LONG[Number(month) - 1].toLowerCase()} de ${year}`;
}

// Today's "YYYY-MM-DD" in Brazil time.
export function todayInBrazil() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export const PAST_DATE_ERROR = "Escolha hoje ou uma data futura. Conteúdos de dias que já passaram são apagados.";

// Current "YYYY-MM" in Brazil time.
export function currentMonth() {
  return todayInBrazil().slice(0, 7);
}

// Timestamp in Brazil time, e.g. "24/10/2026, 15:33" (servers run in UTC).
export function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

// Short age of a timestamp: "agora", "há 5 min", "há 3 h", "há 2 dias", then "24/10".
export function formatRelative(timestamp: string, now: number) {
  const minutes = Math.floor((now - new Date(timestamp).getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "há 1 dia" : `há ${days} dias`;
  return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

// "2026-11" -> "Novembro de 2026"
export function formatMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  return `${MONTHS_LONG[Number(month) - 1]} de ${year}`;
}

export function isYearMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// First day of the month and of the next month, for date range filters.
export function monthRange(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return { from: `${yearMonth}-01`, to: `${next}-01` };
}
