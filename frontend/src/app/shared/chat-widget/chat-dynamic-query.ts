import { OtItem } from './chat.types';
import { normalizeText } from './chat-text.utils';

export type DynamicQueryMeta = {
  limit: number | null;
  latest: boolean;
  exactDateIso: string | null;
  month: number | null;
  year: number | null;
  yearOnly: boolean;
  asksCount: boolean;
  usedDefaultYear: boolean;
  defaultYear: number | null;
  hasDynamicRequest: boolean;
};

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const MONTH_NAMES: Record<number, string> = {
  1: 'enero',
  2: 'febrero',
  3: 'marzo',
  4: 'abril',
  5: 'mayo',
  6: 'junio',
  7: 'julio',
  8: 'agosto',
  9: 'septiembre',
  10: 'octubre',
  11: 'noviembre',
  12: 'diciembre',
};

export function parseDynamicQueryMeta(query: string, ots: OtItem[]): DynamicQueryMeta {
  const normalized = normalizeText(query);
  const exactDateIso = extractExactDateIso(query);
  const monthInfo = extractMonthYear(normalized);
  const explicitYear = extractYear(normalized);
  const asksCount = /\bcuantas?\b|\bcuantos?\b/.test(normalized);
  const latest = /\bultim[ao]s?\b|\brecientes?\b/.test(normalized);
  const limit = extractDynamicLimit(query, normalized, exactDateIso);
  const defaultYear = getDefaultYear(ots);
  const yearOnly = !monthInfo && explicitYear !== null && hasYearScopeCue(normalized, explicitYear);

  let month = monthInfo?.month ?? null;
  let year = monthInfo?.year ?? (yearOnly ? explicitYear : null);
  let usedDefaultYear = false;

  if (month && !year && defaultYear) {
    year = defaultYear;
    usedDefaultYear = true;
  }

  const hasDynamicRequest = Boolean(
    limit || exactDateIso || month || yearOnly || latest || asksCount
  );

  return {
    limit,
    latest,
    exactDateIso,
    month,
    year,
    yearOnly,
    asksCount,
    usedDefaultYear,
    defaultYear,
    hasDynamicRequest,
  };
}

export function filterByExactDate(items: OtItem[], isoDate: string): OtItem[] {
  return items.filter((item) => item.fecha === isoDate);
}

export function filterByMonthYear(items: OtItem[], month: number, year: number): OtItem[] {
  return items.filter((item) => {
    const [y, m] = item.fecha.split('-').map(Number);
    return y === year && m === month;
  });
}

export function filterByYear(items: OtItem[], year: number): OtItem[] {
  return items.filter((item) => Number(item.fecha.split('-')[0]) === year);
}

export function sortByFechaDesc(items: OtItem[]): OtItem[] {
  return [...items].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function monthName(month: number): string {
  return MONTH_NAMES[month] ?? `mes ${month}`;
}

export function formatIsoDateToDisplay(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

function extractExactDateIso(query: string): string | null {
  const m = query.match(/\b(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})\b/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function extractMonthYear(normalized: string): { month: number; year: number | null } | null {
  const monthToken = Object.keys(MONTHS).find((name) => normalized.includes(name));
  if (!monthToken) return null;
  const month = MONTHS[monthToken];
  const year = extractYear(normalized);
  return { month, year };
}

function extractYear(normalized: string): number | null {
  const yearMatch = normalized.match(/\b(20\d{2}|19\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : null;
}

function hasYearScopeCue(normalized: string, year: number): boolean {
  return new RegExp(`\\b(de|del|en|ano|año)\\s+${year}\\b`).test(normalized);
}

function extractDynamicLimit(
  query: string,
  normalized: string,
  exactDateIso: string | null
): number | null {
  if (exactDateIso) return null;

  // Evita confundir OT-001 con "cantidad"
  const normalizedWithoutOt = normalized.replace(/\bot\s+\d+\b/g, ' ');

  // Muy flexible: primer número de 1-3 dígitos en la consulta
  const m = normalizedWithoutOt.match(/\b(\d{1,3})\b/);
  if (!m) return null;

  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  // Evita tomar año de 4 dígitos (ya cubierto por regex 1-3, por seguridad)
  if (query.includes(String(n)) && String(n).length === 4) return null;

  return n;
}

function getDefaultYear(ots: OtItem[]): number | null {
  if (!ots.length) return null;
  const years = ots
    .map((o) => Number(o.fecha.split('-')[0]))
    .filter((y) => Number.isFinite(y));
  return years.length ? Math.max(...years) : null;
}
