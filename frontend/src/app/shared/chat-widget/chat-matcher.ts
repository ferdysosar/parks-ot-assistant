import { GlobalResolution, OtItem, RankedMatch } from './chat.types';
import {
  cleanQueryForSearch,
  extractMeaningfulTokens,
  extractRelevantQuery,
  normalizeText,
  scoreEntityWithTokens,
  scoreSoft,
} from './chat-text.utils';

export function getBestMatches(
  query: string,
  field: 'empresa' | 'activo',
  ots: OtItem[]
): Array<{ value: string; score: number }> {
  const cleanedQuery = extractRelevantQuery(normalizeText(query), field);
  const tokens = extractMeaningfulTokens(cleanedQuery);
  const values = [...new Set(ots.map((item) => item[field]))];

  return values
    .map((value) => ({
      value,
      score: scoreEntityWithTokens(tokens, normalizeText(value)),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function findBestGlobalMatch(query: string, ots: OtItem[]): GlobalResolution {
  const normalizedQuery = normalizeText(query);
  const cleanedQuery = cleanQueryForSearch(normalizedQuery);
  const tokens = extractMeaningfulTokens(cleanedQuery);

  const otCandidates: RankedMatch[] = ots.map((item) => ({
    type: 'ot',
    value: item.ot_numero,
    score: scoreOtQuery(query, item.ot_numero),
  }));

  const companyCandidates: RankedMatch[] = [...new Set(ots.map((item) => item.empresa))].map(
    (empresa) => ({
      type: 'empresa',
      value: empresa,
      score: scoreEntityWithTokens(tokens, normalizeText(empresa)),
    })
  );

  const assetCandidates: RankedMatch[] = [...new Set(ots.map((item) => item.activo))].map(
    (activo) => ({
      type: 'activo',
      value: activo,
      score: scoreEntityWithTokens(tokens, normalizeText(activo)),
    })
  );

  const all = [...otCandidates, ...companyCandidates, ...assetCandidates]
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score);

  if (!all.length) return { mode: 'none' };

  const uniqueStrongMatches: RankedMatch[] = [];

  for (const item of all) {
    const alreadyExists = uniqueStrongMatches.some(
      (existing) =>
        existing.type === item.type &&
        normalizeText(existing.value) === normalizeText(item.value)
    );

    if (!alreadyExists && item.score >= 65) {
      uniqueStrongMatches.push(item);
    }
  }

  uniqueStrongMatches.sort((a, b) => b.score - a.score);

  if (uniqueStrongMatches.length >= 2) {
    return {
      mode: 'multiple',
      matches: uniqueStrongMatches.slice(0, 4),
    };
  }

  if (all[0].score < 65) return { mode: 'none' };

  return {
    mode: 'single',
    match: all[0],
  };
}

export function scoreOtQuery(query: string, otValue: string): number {
  const otMatch = query.match(/ot[\s-]*(\d{1,})/i);
  if (otMatch?.[1]) {
    const extracted = `OT-${otMatch[1].padStart(3, '0')}`;
    if (normalizeText(extracted) === normalizeText(otValue)) {
      return 120;
    }
  }

  const normalizedQuery = cleanQueryForSearch(normalizeText(query));
  const normalizedOt = normalizeText(otValue);

  if (!normalizedQuery) return 0;
  return scoreSoft(normalizedQuery, normalizedOt);
}
