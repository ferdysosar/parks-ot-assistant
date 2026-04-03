import { Injectable } from '@angular/core';
import otsData from '../../../assets/ots-demo.json';
import {
  ChatContext,
  GlobalMatchType,
  GlobalResolution,
  OtItem,
  QueryIntent,
  RankedMatch,
} from './chat.types';
import { parseQuery as parseIntentQuery } from './chat-intent.parser';
import {
  filterByExactDate,
  filterByMonthYear,
  filterByYear,
  formatIsoDateToDisplay,
  monthName,
  parseDynamicQueryMeta,
  sortByFechaDesc,
} from './chat-dynamic-query';
import {
  findBestGlobalMatch as matcherFindBestGlobalMatch,
  getBestMatches as matcherGetBestMatches,
  scoreOtQuery as matcherScoreOtQuery,
} from './chat-matcher';
import {
  cleanQueryForSearch as utilCleanQueryForSearch,
  escapeRegex as utilEscapeRegex,
  extractMeaningfulTokens as utilExtractMeaningfulTokens,
  extractRelevantQuery as utilExtractRelevantQuery,
  includesAny as utilIncludesAny,
  levenshtein as utilLevenshtein,
  normalizeText as utilNormalizeText,
  removeStopWords as utilRemoveStopWords,
  scoreEntityWithTokens as utilScoreEntityWithTokens,
  scoreSoft as utilScoreSoft,
  scoreTokenAgainstTarget as utilScoreTokenAgainstTarget,
} from './chat-text.utils';
import {
  formatDetailedOtList as utilFormatDetailedOtList,
  formatMultipleMatches as utilFormatMultipleMatches,
  formatOtList as utilFormatOtList,
  formatSingleOt as utilFormatSingleOt,
} from './chat-response-formatter';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private turnCounter = 0;
  private lastDynamicTurn = -1;
  private lastDynamicContext: {
    exactDateIso: string | null;
    month: number | null;
    year: number | null;
    asksCount: boolean;
    latest: boolean;
    limit: number | null;
    scopeType: 'empresa' | 'activo' | null;
    scopeEntity: string | null;
  } | null = null;

  private ots: OtItem[] = (otsData as OtItem[]) ?? [];
  private lastContext: ChatContext = {
    type: null,
    value: null,
  };

  resolveQuery(query: string): string {
    this.turnCounter++;
    const normalizedQuery = this.normalizeText(query);

    if (
      this.isContextualFollowUp(normalizedQuery) &&
      this.lastContext.type &&
      this.lastContext.value
    ) {
      return this.resolveUsingContext(normalizedQuery);
    }

    const dynamicFollowUp = this.resolveDynamicFollowUp(query, normalizedQuery);
    if (dynamicFollowUp) {
      return dynamicFollowUp;
    }

    if (this.isGreetingQuery(normalizedQuery)) {
      return this.buildGreetingResponse();
    }

    const faqGuidance = this.resolveFaqGuidance(normalizedQuery);
    if (faqGuidance) {
      return faqGuidance;
    }

    const parsed = this.parseQuery(query);
    const globalResolution = this.findBestGlobalMatch(query);

    const dynamicResponse = this.resolveDynamicQuery(query, normalizedQuery, parsed);
    if (dynamicResponse) {
      return dynamicResponse;
    }

    if (globalResolution.mode === 'multiple' && globalResolution.matches) {
      this.clearContext();

      return this.formatMultipleMatches(
        'Detecté múltiples coincidencias:',
        globalResolution.matches
      );
    }

    if (parsed.intent === 'ot' && parsed.value) {
      const ot = this.findOtByNumber(parsed.value);

      if (!ot) {
        return `No encontré la ${parsed.value}. Probá con otro número de OT.`;
      }

      this.setContext('ot', ot.ot_numero);
      return this.formatSingleOt(ot);
    }

    if (parsed.intent === 'empresa') {
      const rankedCompanies = this.getBestMatches(query, 'empresa');

      if (
        rankedCompanies.length >= 2 &&
        rankedCompanies[0].score >= 70 &&
        rankedCompanies[1].score >= 70
      ) {
        this.clearContext();

        return this.formatMultipleMatches(
          'Detecté múltiples coincidencias de empresas:',
          rankedCompanies.slice(0, 4).map((item) => ({
            type: 'empresa' as const,
            value: item.value,
            score: item.score,
          }))
        );
      }

      if (rankedCompanies.length > 0 && rankedCompanies[0].score >= 65) {
        const bestCompany = rankedCompanies[0].value;
        const results = this.ots.filter(
          (item) =>
            this.normalizeText(item.empresa) === this.normalizeText(bestCompany)
        );

        this.setContext('empresa', bestCompany);

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          return this.formatSingleOt(results[0]);
        }

        return this.formatOtList(
          `Encontré ${results.length} orden(es) para la empresa "${bestCompany}":`,
          results
        );
      }
    }

    if (parsed.intent === 'activo') {
      const rankedAssets = this.getBestMatches(query, 'activo');

      if (
        rankedAssets.length >= 2 &&
        rankedAssets[0].score >= 70 &&
        rankedAssets[1].score >= 70
      ) {
        this.clearContext();

        return this.formatMultipleMatches(
          'Detecté múltiples coincidencias de activos:',
          rankedAssets.slice(0, 4).map((item) => ({
            type: 'activo' as const,
            value: item.value,
            score: item.score,
          }))
        );
      }

      if (rankedAssets.length > 0 && rankedAssets[0].score >= 65) {
        const bestAsset = rankedAssets[0].value;
        const results = this.ots.filter(
          (item) =>
            this.normalizeText(item.activo) === this.normalizeText(bestAsset)
        );

        this.setContext('activo', bestAsset);

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          return this.formatSingleOt(results[0]);
        }

        return this.formatOtList(
          `Encontré ${results.length} orden(es) para el activo "${bestAsset}":`,
          results
        );
      }
    }

    if (globalResolution.mode === 'single' && globalResolution.match) {
      const globalResult = globalResolution.match;

      if (globalResult.type === 'ot') {
        const ot = this.findOtByNumber(globalResult.value);

        if (!ot) {
          return 'Encontré una coincidencia probable, pero no pude resolverla correctamente.';
        }

        this.setContext('ot', ot.ot_numero);
        return this.formatSingleOt(ot);
      }

      if (globalResult.type === 'empresa') {
        const results = this.ots.filter(
          (item) =>
            this.normalizeText(item.empresa) ===
            this.normalizeText(globalResult.value)
        );

        this.setContext('empresa', globalResult.value);

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          return this.formatSingleOt(results[0]);
        }

        return this.formatOtList(
          `Tomé como mejor coincidencia la empresa "${globalResult.value}". Encontré ${results.length} orden(es):`,
          results
        );
      }

      if (globalResult.type === 'activo') {
        const results = this.ots.filter(
          (item) =>
            this.normalizeText(item.activo) ===
            this.normalizeText(globalResult.value)
        );

        this.setContext('activo', globalResult.value);

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          return this.formatSingleOt(results[0]);
        }

        return this.formatOtList(
          `Tomé como mejor coincidencia el activo "${globalResult.value}". Encontré ${results.length} orden(es):`,
          results
        );
      }
    }

    if (this.isLooseInputWithoutContext(normalizedQuery)) {
      return this.buildLooseInputHelp(query);
    }

    return 'No pude encontrar resultados con ese mensaje. Probá con algo más específico, por ejemplo: "OT-011", "últimas 5 del Aurora I", "qué OTs se hicieron el 26/03/2026" o "qué OTs hubo en marzo 2025".';
  }

  private resolveUsingContext(normalizedQuery: string): string {
    if (!this.lastContext.type || !this.lastContext.value) {
      return 'No tengo contexto previo suficiente. Probá nombrando una OT, empresa o activo.';
    }

    if (this.lastContext.type === 'ot') {
      const ot = this.findOtByNumber(this.lastContext.value);

      if (!ot) {
        this.clearContext();
        return 'Perdí el contexto de la OT anterior. Probá consultándola de nuevo.';
      }

      return this.formatSingleOt(ot);
    }

    if (this.lastContext.type === 'activo') {
      const results = this.ots.filter(
        (item) =>
          this.normalizeText(item.activo) ===
          this.normalizeText(this.lastContext.value as string)
      );

      if (!results.length) {
        this.clearContext();
        return 'Perdí el contexto del activo anterior. Probá nombrándolo otra vez.';
      }

      if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
        return this.formatSingleOt(results[0]);
      }

      if (this.isWorkRequest(normalizedQuery)) {
        return this.formatDetailedOtList(
          `Estos son los trabajos asociados al activo "${this.lastContext.value}":`,
          results
        );
      }

      return this.formatOtList(
        `Sigo con el activo "${this.lastContext.value}". Encontré ${results.length} orden(es):`,
        results
      );
    }

    if (this.lastContext.type === 'empresa') {
      const results = this.ots.filter(
        (item) =>
          this.normalizeText(item.empresa) ===
          this.normalizeText(this.lastContext.value as string)
      );

      if (!results.length) {
        this.clearContext();
        return 'Perdí el contexto de la empresa anterior. Probá nombrándola otra vez.';
      }

      if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
        return this.formatSingleOt(results[0]);
      }

      if (this.isWorkRequest(normalizedQuery)) {
        return this.formatDetailedOtList(
          `Estos son los trabajos asociados a la empresa "${this.lastContext.value}":`,
          results
        );
      }

      return this.formatOtList(
        `Sigo con la empresa "${this.lastContext.value}". Encontré ${results.length} orden(es):`,
        results
      );
    }

    return 'No tengo contexto previo suficiente. Probá de nuevo.';
  }

  private isContextualFollowUp(normalizedQuery: string): boolean {
    if (!this.lastContext.type || !this.lastContext.value) return false;

    return this.includesAny(normalizedQuery, [
      'y',
      'y sus',
      'sus',
      'sus trabajos',
      'sus ordenes',
      'sus órdenes',
      'que trabajos tiene',
      'qué trabajos tiene',
      'que trabajos hizo',
      'qué trabajos hizo',
      'mostrame el detalle',
      'mostrar detalle',
      'detalle',
      'ver detalle',
      'mas detalle',
      'más detalle',
      'ampliame',
      'amplia',
      'ampliar',
      'quiero mas',
      'quiero más',
      'segui',
      'seguí',
      'continua',
      'continúa',
    ]);
  }

  private isWorkRequest(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'trabajo',
      'trabajos',
      'orden',
      'ordenes',
      'órdenes',
      'ot',
      'ots',
      'que hizo',
      'qué hizo',
      'que trabajos',
      'qué trabajos',
      'sus trabajos',
      'sus ordenes',
      'sus órdenes',
    ]);
  }

  private isDetailRequest(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'detalle',
      'detalles',
      'ver detalle',
      'mostrame el detalle',
      'mostrar detalle',
      'ampliame',
      'amplia',
      'ampliar',
      'completo',
      'completa',
      'info completa',
      'informacion completa',
      'información completa',
      'mas info',
      'más info',
    ]);
  }

  private setContext(type: GlobalMatchType, value: string): void {
    this.lastContext = { type, value };
  }

  private clearContext(): void {
    this.lastContext = { type: null, value: null };
  }

  private parseQuery(query: string): {
    intent: QueryIntent;
    value: string | null;
    originalEntity: string;
  } {
    return parseIntentQuery(query, this.ots);
  }

  private otCountLabel(count: number): string {
    return count === 1 ? 'OT' : 'OTs';
  }

  private isGreetingQuery(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'hola',
      'buenas',
      'buen dia',
      'buen día',
      'buenas tardes',
      'buenas noches',
      'hey',
      'que tal',
      'qué tal',
    ]);
  }

  private buildGreetingResponse(): string {
    return [
      'Hola, soy Parks OT Assistant.',
      '',
      'Puedo ayudarte a consultar OTs por número, empresa, activo, fecha o mes.',
      'Ejemplos:',
      '• "OT-011"',
      '• "últimas 5 del Aurora I"',
      '• "qué OTs se hicieron el 26/03/2026"',
      '• "qué OTs hubo en marzo 2025"',
    ].join('\n');
  }

  private resolveFaqGuidance(normalizedQuery: string): string | null {
    if (!this.isFaqHelpQuery(normalizedQuery)) return null;

    if (this.isFaqOtNumberQuery(normalizedQuery)) {
      return [
        'Para consultar una OT por número, escribí el identificador directamente.',
        'Ejemplo: "OT-001".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['empresa'])) {
      return [
        'Podés buscar OTs por empresa indicando "empresa" y el nombre a consultar.',
        'Ejemplo: "qué OTs tiene la empresa Naviera del Sur".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['activo', 'barco', 'buque', 'embarcacion'])) {
      return [
        'Podés buscar OTs por activo mencionando el activo en la consulta.',
        'Ejemplo: "qué OTs tiene el activo Remolcador Alfa".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['fecha', 'dia', 'dia especifico', 'fecha especifica'])) {
      return [
        'Para consultar por fecha exacta, usá formato día/mes/año.',
        'Ejemplo: "qué OTs se hicieron el 26/03/2026".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['mes', 'ano', 'año', 'periodo', 'periodo mensual', 'periodo anual'])) {
      return [
        'Podés filtrar por mes o por año para ver órdenes de un período.',
        'Ejemplo: "qué OTs hubo en marzo 2025".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['ultimas', 'ultimos', 'recientes', 'mas recientes'])) {
      return [
        'Para ver órdenes recientes, pedí "últimas" y opcionalmente una cantidad.',
        'Ejemplo: "últimas 5 órdenes".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['cuantas', 'cuantos', 'conteo', 'contar', 'cantidad'])) {
      return [
        'Podés pedir conteo de OTs por período usando una consulta de cantidad.',
        'Ejemplo: "cuántas OTs hubo en 2025".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['no reconoce', 'no encuentra', 'sin resultados', 'no hay resultados', 'error'])) {
      return [
        'Si no se reconoce la consulta, probá con una frase más específica y con un solo criterio.',
        'Ejemplos: "OT-001", "qué OTs hubo en marzo 2025", "últimas 5 órdenes".',
      ].join('\n');
    }

    return [
      'Puedo ayudarte con consultas por OT, empresa, activo, fecha, mes, año, últimas órdenes y conteos por período.',
      'Ejemplos: "OT-001", "qué OTs hubo en marzo 2025", "últimas 5 órdenes".',
    ].join('\n');
  }

  private isFaqHelpQuery(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'como',
      'como consulto',
      'como busco',
      'como veo',
      'como cuento',
      'como hago',
      'que puedo consultar',
      'ayuda',
      'faq',
      'preguntas frecuentes',
      'que hago si',
      'no reconoce',
      'no encuentra',
      'sin resultados',
      'no hay resultados',
    ]);
  }

  private matchesFaqTopic(normalizedQuery: string, terms: string[]): boolean {
    return terms.some((term) => normalizedQuery.includes(this.normalizeText(term)));
  }

  private isFaqOtNumberQuery(normalizedQuery: string): boolean {
    if (
      this.includesAny(normalizedQuery, [
        'ot por numero',
        'numero de ot',
        'numero de la ot',
        'consultar una ot por numero',
        'buscar una ot por numero',
      ])
    ) {
      return true;
    }

    const hasOt =
      /\bot\b/.test(normalizedQuery) ||
      this.includesAny(normalizedQuery, ['orden de trabajo', 'ordenes de trabajo']);
    const hasNumber = this.includesAny(normalizedQuery, [
      'numero',
      'nro',
      'identificador',
      'codigo',
    ]);

    return hasOt && hasNumber;
  }

  private isLooseInputWithoutContext(normalizedQuery: string): boolean {
    const hasRecentDynamicContext =
      this.lastDynamicContext !== null && this.turnCounter - this.lastDynamicTurn <= 1;
    const hasConversationalContext = !!this.lastContext.type && !!this.lastContext.value;
    if (hasRecentDynamicContext || hasConversationalContext) return false;

    const isOnlyYear = /^\d{4}$/.test(normalizedQuery);
    const isOneWordEntityLike =
      /^[a-záéíóúüñ0-9-]{2,}$/.test(normalizedQuery) && !normalizedQuery.includes(' ');
    const isVeryShortPhrase =
      normalizedQuery.split(' ').length <= 2 && normalizedQuery.length <= 12;

    return isOnlyYear || isOneWordEntityLike || isVeryShortPhrase;
  }

  private buildLooseInputHelp(rawQuery: string): string {
    const q = rawQuery.trim();
    if (/^\d{4}$/.test(q)) {
      return `Si querés filtrar por año, podés pedir por mes + año. Ejemplo: "qué OTs hubo en marzo ${q}".`;
    }

    return [
      `Entiendo "${q}", pero me falta un poco más de contexto.`,
      '',
      'Probá con algo como:',
      '• "últimas 5 del Aurora I"',
      '• "qué OTs hubo en marzo 2025"',
      '• "qué OTs se hicieron el 26/03/2026"',
    ].join('\n');
  }

  private resolveDynamicFollowUp(query: string, normalizedQuery: string): string | null {
    if (!this.lastDynamicContext) return null;
    if (this.turnCounter - this.lastDynamicTurn !== 1) return null;
    if (this.isStandaloneDynamicQuery(normalizedQuery)) return null;

    const patch = this.extractDynamicFollowUpPatch(query, normalizedQuery);
    if (!patch.hasPatch) return null;

    const next = { ...this.lastDynamicContext };

    if (patch.exactDateIso !== null) {
      next.exactDateIso = patch.exactDateIso;
      next.month = null;
      next.year = null;
    }

    if (patch.year !== null) next.year = patch.year;
    if (patch.month !== null) {
      next.month = patch.month;
      next.exactDateIso = null;
      if (patch.year === null && next.year === null) {
        next.year = patch.defaultYear;
      }
    }

    if (patch.limit !== null) next.limit = patch.limit;
    if (patch.latest !== null) next.latest = patch.latest;
    if (patch.asksCount !== null) next.asksCount = patch.asksCount;
    if (patch.scopeEntity && patch.scopeType) {
      next.scopeEntity = patch.scopeEntity;
      next.scopeType = patch.scopeType;
    }

    const synthetic = this.buildSyntheticDynamicQuery(next);
    if (!synthetic) return null;

    const parsed = this.parseQuery(synthetic);
    return this.resolveDynamicQuery(synthetic, this.normalizeText(synthetic), parsed);
  }

  private isStandaloneDynamicQuery(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'que ots',
      'qué ots',
      'que trabajos',
      'qué trabajos',
      'mostrame',
      'mostrar',
      'dame',
      'consulta',
      'consultar',
      'buscar',
      'busca',
      'ultimas',
      'últimas',
      'quiero ver',
    ]);
  }

  private extractDynamicFollowUpPatch(query: string, normalizedQuery: string): {
    hasPatch: boolean;
    exactDateIso: string | null;
    year: number | null;
    month: number | null;
    limit: number | null;
    latest: boolean | null;
    asksCount: boolean | null;
    scopeType: 'empresa' | 'activo' | null;
    scopeEntity: string | null;
    defaultYear: number | null;
  } {
    const meta = parseDynamicQueryMeta(query, this.ots);
    const yearMatch = normalizedQuery.match(/\b(19\d{2}|20\d{2})\b/);
    const explicitYear = yearMatch ? Number(yearMatch[1]) : null;

    const rankedCompanies = this.getBestMatches(query, 'empresa');
    const rankedAssets = this.getBestMatches(query, 'activo');
    const bestCompany = rankedCompanies.length > 0 ? rankedCompanies[0] : null;
    const bestAsset = rankedAssets.length > 0 ? rankedAssets[0] : null;

    let scopeType: 'empresa' | 'activo' | null = null;
    let scopeEntity: string | null = null;

    if (
      bestCompany &&
      bestCompany.score >= 65 &&
      (!bestAsset || bestCompany.score >= bestAsset.score)
    ) {
      scopeType = 'empresa';
      scopeEntity = bestCompany.value;
    } else if (bestAsset && bestAsset.score >= 65) {
      scopeType = 'activo';
      scopeEntity = bestAsset.value;
    }

    const explicitCount =
      /\bcuantas?\b|\bcuantos?\b/.test(normalizedQuery) ? true : null;
    const hasPatch = Boolean(
      meta.exactDateIso !== null ||
      explicitYear !== null ||
      meta.month !== null ||
      meta.limit !== null ||
      meta.latest ||
      explicitCount !== null ||
      scopeEntity
    );

    return {
      hasPatch,
      exactDateIso: meta.exactDateIso,
      year: explicitYear,
      month: meta.month,
      limit: meta.limit,
      latest: meta.latest ? true : null,
      asksCount: explicitCount,
      scopeType,
      scopeEntity,
      defaultYear: meta.defaultYear,
    };
  }

  private buildSyntheticDynamicQuery(ctx: {
    exactDateIso: string | null;
    month: number | null;
    year: number | null;
    asksCount: boolean;
    latest: boolean;
    limit: number | null;
    scopeType: 'empresa' | 'activo' | null;
    scopeEntity: string | null;
  }): string | null {
    if (ctx.exactDateIso) {
      const display = formatIsoDateToDisplay(ctx.exactDateIso);
      return `qué OTs se hicieron el ${display}`;
    }

    if (ctx.month && ctx.year) {
      const base = ctx.asksCount
        ? `cuántas OTs hubo en ${monthName(ctx.month)} ${ctx.year}`
        : `qué OTs hubo en ${monthName(ctx.month)} ${ctx.year}`;
      return ctx.scopeEntity ? `${base} de ${ctx.scopeEntity}` : base;
    }
    if (ctx.year) {
      const base = ctx.asksCount
        ? `cuántas OTs hubo en ${ctx.year}`
        : `qué OTs hubo en ${ctx.year}`;
      return ctx.scopeEntity ? `${base} de ${ctx.scopeEntity}` : base;
    }
    if (ctx.latest || ctx.limit) {
      const qty = ctx.limit ?? 5;
      const base = ctx.latest ? `últimas ${qty}` : `quiero ver ${qty}`;
      return ctx.scopeEntity ? `${base} de ${ctx.scopeEntity}` : base;
    }

    return null;
  }

  private buildDynamicLimitedTitle(params: {
    found: number;
    requested: number;
    latest: boolean;
    scopeEntity: string | null;
  }): string {
    const { found, requested, latest, scopeEntity } = params;
    const foundOtWord = this.otCountLabel(found);
    const requestedOtWord = this.otCountLabel(requested);
    const scopeFor = scopeEntity ? ` para ${scopeEntity}` : '';
    const scopeOf = scopeEntity ? ` de ${scopeEntity}` : '';
    const verb = found === 1 ? 'Se encontró' : 'Se encontraron';

    if (found < requested) {
      if (latest) {
        return `${verb} ${found} de las últimas ${requested} ${requestedOtWord} disponibles${scopeFor}.`;
      }
      return `${verb} ${found} de las ${requested} solicitadas${scopeFor}.`;
    }

    if (latest) {
      return `Mostrando las últimas ${found} ${foundOtWord}${scopeOf}:`;
    }

    return `Mostrando ${found} ${foundOtWord} solicitadas${scopeOf}:`;
  }

  private resolveDynamicQuery(
    query: string,
    normalizedQuery: string,
    parsed: { intent: QueryIntent; value: string | null; originalEntity: string }
  ): string | null {
    const meta = parseDynamicQueryMeta(query, this.ots);
    if (!meta.hasDynamicRequest) return null;

    let scoped: OtItem[] = this.ots;
    let scopeEntity: string | null = null;
    let scopeType: 'empresa' | 'activo' | null = null;

    const rankedCompanies = this.getBestMatches(query, 'empresa');
    const rankedAssets = this.getBestMatches(query, 'activo');
    const bestCompany = rankedCompanies.length > 0 ? rankedCompanies[0] : null;
    const bestAsset = rankedAssets.length > 0 ? rankedAssets[0] : null;
    const companyStrong = !!bestCompany && bestCompany.score >= 65;
    const assetStrong = !!bestAsset && bestAsset.score >= 65;

    if (parsed.intent === 'empresa') {
      if (companyStrong) {
        scopeEntity = bestCompany!.value;
        scopeType = 'empresa';
      }
    } else if (parsed.intent === 'activo') {
      if (assetStrong) {
        scopeEntity = bestAsset!.value;
        scopeType = 'activo';
      }
    } else {
      // Fallback para consultas dinámicas sin intent explícito.
      if (companyStrong && assetStrong) {
        if (bestCompany!.score > bestAsset!.score) {
          scopeEntity = bestCompany!.value;
          scopeType = 'empresa';
        } else if (bestAsset!.score > bestCompany!.score) {
          scopeEntity = bestAsset!.value;
          scopeType = 'activo';
        }
      } else if (companyStrong) {
        scopeEntity = bestCompany!.value;
        scopeType = 'empresa';
      } else if (assetStrong) {
        scopeEntity = bestAsset!.value;
        scopeType = 'activo';
      }
    }

    if (scopeEntity && scopeType === 'empresa') {
      scoped = this.ots.filter(
        (it) => this.normalizeText(it.empresa) === this.normalizeText(scopeEntity as string)
      );
    } else if (scopeEntity && scopeType === 'activo') {
      scoped = this.ots.filter(
        (it) => this.normalizeText(it.activo) === this.normalizeText(scopeEntity as string)
      );
    }

    const baseDynamicContext = {
      exactDateIso: meta.exactDateIso,
      month: meta.month,
      year: meta.year,
      asksCount: meta.asksCount,
      latest: meta.latest,
      limit: meta.limit,
      scopeType,
      scopeEntity,
    };

    const rememberDynamic = (ctx = baseDynamicContext): void => {
      this.lastDynamicContext = ctx;
      this.lastDynamicTurn = this.turnCounter;
    };

    let results = scoped;

    if (meta.exactDateIso) {
      results = filterByExactDate(results, meta.exactDateIso);
      const displayDate = formatIsoDateToDisplay(meta.exactDateIso);
      if (!results.length) {
        rememberDynamic();
        return `No encontré OTs para la fecha ${displayDate}.`;
      }
      rememberDynamic();
      return this.formatOtList(
        `Encontré ${results.length} ${this.otCountLabel(results.length)} para la fecha ${displayDate}:`,
        results
      );
    }

    if (meta.month && meta.year) {
      results = filterByMonthYear(results, meta.month, meta.year);
      results = sortByFechaDesc(results);

      const monthLabel = monthName(meta.month);
      const defaultYearMsg = meta.usedDefaultYear
        ? ` (tomé por defecto el año ${meta.year})`
        : '';

      if (meta.asksCount) {
        rememberDynamic();
        return `En ${monthLabel} de ${meta.year}${defaultYearMsg} hubo ${results.length} ${this.otCountLabel(results.length)}.`;
      }

      if (!results.length) {
        rememberDynamic();
        return `No encontré OTs en ${monthLabel} de ${meta.year}${defaultYearMsg}.`;
      }

      rememberDynamic();
      return this.formatOtList(
        `Encontré ${results.length} ${this.otCountLabel(results.length)} en ${monthLabel} de ${meta.year}${defaultYearMsg}:`,
        results
      );
    }

    // Consulta por año (ej: "del 2025")
    if (meta.yearOnly && meta.year) {
      results = filterByYear(results, meta.year);
      results = sortByFechaDesc(results);

      if (meta.asksCount) {
        rememberDynamic();
        return `En ${meta.year} hubo ${results.length} ${this.otCountLabel(results.length)}.`;
      }

      if (!results.length) {
        rememberDynamic();
        return `No encontré OTs en ${meta.year}.`;
      }

      rememberDynamic();
      return this.formatOtList(
        `Encontré ${results.length} ${this.otCountLabel(results.length)} en ${meta.year}:`,
        results
      );
    }

    // "últimas" sin número => default 5
    if (meta.latest && !meta.limit) {
      const defaultLatest = 5;
      const latestResults = sortByFechaDesc(results).slice(0, defaultLatest);
      if (!latestResults.length) return 'No encontré resultados para esa consulta.';

      const title = this.buildDynamicLimitedTitle({
        found: latestResults.length,
        requested: defaultLatest,
        latest: true,
        scopeEntity,
      });
      rememberDynamic({
        ...baseDynamicContext,
        latest: true,
        limit: defaultLatest,
      });
      return this.formatOtList(title, latestResults);
    }

    if (meta.latest || meta.limit) {
      results = sortByFechaDesc(results);
    }

    if (meta.limit) {
      const limited = results.slice(0, meta.limit);
      if (!limited.length) return 'No encontré resultados para esa consulta.';

      const title = this.buildDynamicLimitedTitle({
        found: limited.length,
        requested: meta.limit,
        latest: meta.latest,
        scopeEntity,
      });
      rememberDynamic();
      return this.formatOtList(title, limited);
    }

    // asksCount sin mes/fecha/número no altera comportamiento actual
    return null;
  }

  private findOtByNumber(otNumber: string): OtItem | undefined {
    const normalizedTarget = this.normalizeText(otNumber);

    return this.ots.find(
      (item) => this.normalizeText(item.ot_numero) === normalizedTarget
    );
  }

  private getBestMatches(
    query: string,
    field: 'empresa' | 'activo'
  ): Array<{ value: string; score: number }> {
    return matcherGetBestMatches(query, field, this.ots);
  }

  private findBestGlobalMatch(query: string): GlobalResolution {
    return matcherFindBestGlobalMatch(query, this.ots);
  }

  private scoreOtQuery(query: string, otValue: string): number {
    return matcherScoreOtQuery(query, otValue);
  }

  private scoreEntityWithTokens(tokens: string[], target: string): number {
    return utilScoreEntityWithTokens(tokens, target);
  }

  private scoreTokenAgainstTarget(token: string, target: string): number {
    return utilScoreTokenAgainstTarget(token, target);
  }

  private scoreSoft(query: string, target: string): number {
    return utilScoreSoft(query, target);
  }

  private extractMeaningfulTokens(query: string): string[] {
    return utilExtractMeaningfulTokens(query);
  }

  private levenshtein(a: string, b: string): number {
    return utilLevenshtein(a, b);
  }

  private extractRelevantQuery(query: string, field: 'empresa' | 'activo'): string {
    return utilExtractRelevantQuery(query, field);
  }

  private cleanQueryForSearch(query: string): string {
    return utilCleanQueryForSearch(query);
  }

  private removeStopWords(query: string, stopWords: string[]): string {
    return utilRemoveStopWords(query, stopWords);
  }

  private formatSingleOt(item: OtItem): string {
    return utilFormatSingleOt(item);
  }

  private formatOtList(title: string, items: OtItem[]): string {
    return utilFormatOtList(title, items);
  }

  private formatDetailedOtList(title: string, items: OtItem[]): string {
    return utilFormatDetailedOtList(title, items);
  }

  private formatMultipleMatches(title: string, matches: RankedMatch[]): string {
    return utilFormatMultipleMatches(title, matches);
  }

  private normalizeText(value: string): string {
    return utilNormalizeText(value);
  }

  private includesAny(text: string, terms: string[]): boolean {
    return utilIncludesAny(text, terms);
  }

  private escapeRegex(value: string): string {
    return utilEscapeRegex(value);
  }
}

