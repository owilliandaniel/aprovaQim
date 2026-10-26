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

// Current "YYYY-MM" in Brazil time.
export function currentMonth() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}

// Timestamp in Brazil time, e.g. "24/10/2026, 15:33" (servers run in UTC).
export function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
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
