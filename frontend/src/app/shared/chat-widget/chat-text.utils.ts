export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeText(term)));
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function removeStopWords(query: string, stopWords: string[]): string {
  let cleaned = query;

  for (const word of stopWords) {
    const normalizedWord = normalizeText(word);
    const regex = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'g');
    cleaned = cleaned.replace(regex, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function extractRelevantQuery(query: string, field: 'empresa' | 'activo'): string {
  const stopWordsCommon = [
    'mostrar', 'mostrame', 'muestrame', 'buscar', 'busca', 'ver', 'quiero',
    'quiero ver', 'decime', 'dame', 'consultar', 'consulta', 'que', 'qué',
    'cuales', 'cuáles', 'trabajos', 'trabajo', 'orden', 'ordenes', 'órdenes',
    'de', 'del', 'la', 'las', 'el', 'los', 'en', 'se', 'hicieron', 'hizo',
  ];

  const stopWordsEmpresa =
    field === 'empresa'
      ? ['empresa', 'empresas', 'cliente', 'clientes', 'naviera', 'compania', 'compañia']
      : ['activo', 'activos', 'barco', 'barcos', 'buque', 'buques', 'embarcacion', 'embarcaciones'];

  return removeStopWords(query, [...stopWordsCommon, ...stopWordsEmpresa]);
}

export function cleanQueryForSearch(query: string): string {
  return removeStopWords(query, [
    'mostrar', 'mostrame', 'muestrame', 'buscar', 'busca', 'ver', 'quiero',
    'quiero ver', 'decime', 'dame', 'consultar', 'consulta', 'que', 'qué',
    'cuales', 'cuáles', 'trabajos', 'trabajo', 'orden', 'ordenes', 'órdenes',
    'de', 'del', 'la', 'las', 'el', 'los', 'en', 'se', 'hicieron', 'hizo',
    'empresa', 'empresas', 'cliente', 'clientes', 'naviera', 'compania', 'compañia',
    'activo', 'activos', 'barco', 'barcos', 'buque', 'buques', 'embarcacion', 'embarcaciones',
  ]);
}

export function extractMeaningfulTokens(query: string): string[] {
  const words = query.split(' ').filter((word) => word.length >= 3);
  const tokens = new Set<string>();

  for (const word of words) tokens.add(word);

  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`.trim();
    if (pair.length >= 6) tokens.add(pair);
  }

  return [...tokens];
}

export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function scoreTokenAgainstTarget(token: string, target: string): number {
  if (!token || !target) return 0;

  if (token === target) return 100;
  if (target.startsWith(token)) return 85;
  if (target.includes(token)) return 70;

  const targetWords = target.split(' ').filter(Boolean);

  for (const word of targetWords) {
    if (word === token) return 75;
    if (word.startsWith(token)) return 60;
    if (token.length >= 4 && word.includes(token)) return 45;
    if (token.length >= 4 && word.length >= 4 && levenshtein(token, word) === 1) {
      return 35;
    }
  }

  return 0;
}

export function scoreSoft(query: string, target: string): number {
  if (!query || !target) return 0;

  if (query === target) return 100;
  if (target.startsWith(query)) return 85;
  if (target.includes(query)) return 70;
  if (query.includes(target)) return 55;

  const queryWords = query.split(' ').filter(Boolean);
  const targetWords = target.split(' ').filter(Boolean);

  let score = 0;

  for (const qWord of queryWords) {
    for (const tWord of targetWords) {
      if (qWord === tWord) score += 25;
      else if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) score += 18;
      else if (tWord.includes(qWord) || qWord.includes(tWord)) score += 12;
      else if (qWord.length >= 4 && tWord.length >= 4 && levenshtein(qWord, tWord) === 1) {
        score += 10;
      }
    }
  }

  return score;
}

export function scoreEntityWithTokens(tokens: string[], target: string): number {
  if (!tokens.length || !target) return 0;

  let score = 0;
  let matchedTokens = 0;
  let strongMatches = 0;

  for (const token of tokens) {
    const tokenScore = scoreTokenAgainstTarget(token, target);

    if (tokenScore > 0) {
      matchedTokens++;
      score += tokenScore;

      if (token.length >= 4 && tokenScore >= 60) {
        strongMatches++;
      }
    }
  }

  if (matchedTokens === 1 && strongMatches === 0) return 0;
  if (matchedTokens === 0) return 0;

  score += matchedTokens * 8;
  if (matchedTokens >= 2) score += 12;
  if (matchedTokens >= 3) score += 18;

  return score;
}
