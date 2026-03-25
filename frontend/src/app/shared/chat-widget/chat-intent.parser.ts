import { OtItem, QueryIntent } from './chat.types';
import { includesAny, normalizeText } from './chat-text.utils';

type ParsedQuery = {
  intent: QueryIntent;
  value: string | null;
  originalEntity: string;
};

export function parseQuery(query: string, ots: OtItem[]): ParsedQuery {
  const normalizedQuery = normalizeText(query);

  const otMatch = query.match(/ot[\s-]*(\d{1,})/i);
  if (otMatch?.[1]) {
    const number = otMatch[1].padStart(3, '0');
    return {
      intent: 'ot',
      value: `OT-${number}`,
      originalEntity: `OT-${number}`,
    };
  }

  const asksForCompany = includesAny(normalizedQuery, [
    'empresa',
    'empresas',
    'cliente',
    'clientes',
    'naviera',
    'compania',
    'compañia',
    'ordenes de',
    'órdenes de',
    'trabajos de',
  ]);

  const asksForAsset = includesAny(normalizedQuery, [
    'activo',
    'activos',
    'barco',
    'barcos',
    'buque',
    'buques',
    'embarcacion',
    'embarcaciones',
    'trabajos del barco',
    'trabajos en',
    'que trabajos se hicieron en',
    'qué trabajos se hicieron en',
  ]);

  if (asksForCompany && !asksForAsset) {
    return { intent: 'empresa', value: null, originalEntity: '' };
  }

  if (asksForAsset && !asksForCompany) {
    return { intent: 'activo', value: null, originalEntity: '' };
  }

  const matchedCompany = matchKnownCompany(normalizedQuery, ots);
  if (matchedCompany) {
    return {
      intent: 'empresa',
      value: matchedCompany,
      originalEntity: matchedCompany,
    };
  }

  const matchedAsset = matchKnownAsset(normalizedQuery, ots);
  if (matchedAsset) {
    return {
      intent: 'activo',
      value: matchedAsset,
      originalEntity: matchedAsset,
    };
  }

  return { intent: 'unknown', value: null, originalEntity: '' };
}

function matchKnownCompany(query: string, ots: OtItem[]): string | null {
  const companies = [...new Set(ots.map((item) => item.empresa))];

  for (const company of companies) {
    const normalizedCompany = normalizeText(company);

    if (query.includes(normalizedCompany) || normalizedCompany.includes(query)) {
      return company;
    }
  }

  return null;
}

function matchKnownAsset(query: string, ots: OtItem[]): string | null {
  const assets = [...new Set(ots.map((item) => item.activo))];

  for (const asset of assets) {
    const normalizedAsset = normalizeText(asset);

    if (query.includes(normalizedAsset) || normalizedAsset.includes(query)) {
      return asset;
    }
  }

  return null;
}
