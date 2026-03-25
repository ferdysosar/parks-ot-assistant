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
  private ots: OtItem[] = (otsData as OtItem[]) ?? [];
  private lastContext: ChatContext = {
    type: null,
    value: null,
  };

  resolveQuery(query: string): string {
    const normalizedQuery = this.normalizeText(query);

    if (
      this.isContextualFollowUp(normalizedQuery) &&
      this.lastContext.type &&
      this.lastContext.value
    ) {
      return this.resolveUsingContext(normalizedQuery);
    }

    const parsed = this.parseQuery(query);
    const globalResolution = this.findBestGlobalMatch(query);

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

    return 'No encontré resultados con esa consulta. Probá con una OT, una empresa o un activo. Ejemplos: "OT-002", "Aurora", "Río Norte", "Galerna".';
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
    const cleanedQuery = this.extractRelevantQuery(this.normalizeText(query), field);
    const tokens = this.extractMeaningfulTokens(cleanedQuery);
    const values = [...new Set(this.ots.map((item) => item[field]))];

    return values
      .map((value) => ({
        value,
        score: this.scoreEntityWithTokens(tokens, this.normalizeText(value)),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private findBestGlobalMatch(query: string): GlobalResolution {
    const normalizedQuery = this.normalizeText(query);
    const cleanedQuery = this.cleanQueryForSearch(normalizedQuery);
    const tokens = this.extractMeaningfulTokens(cleanedQuery);

    const otCandidates: RankedMatch[] = this.ots.map((item) => ({
      type: 'ot',
      value: item.ot_numero,
      score: this.scoreOtQuery(query, item.ot_numero),
    }));

    const companyCandidates: RankedMatch[] = [...new Set(this.ots.map((item) => item.empresa))].map(
      (empresa) => ({
        type: 'empresa',
        value: empresa,
        score: this.scoreEntityWithTokens(tokens, this.normalizeText(empresa)),
      })
    );

    const assetCandidates: RankedMatch[] = [...new Set(this.ots.map((item) => item.activo))].map(
      (activo) => ({
        type: 'activo',
        value: activo,
        score: this.scoreEntityWithTokens(tokens, this.normalizeText(activo)),
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
          this.normalizeText(existing.value) === this.normalizeText(item.value)
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

  private scoreOtQuery(query: string, otValue: string): number {
    const otMatch = query.match(/ot[\s-]*(\d{1,})/i);
    if (otMatch?.[1]) {
      const extracted = `OT-${otMatch[1].padStart(3, '0')}`;

      if (this.normalizeText(extracted) === this.normalizeText(otValue)) {
        return 120;
      }
    }

    const normalizedQuery = this.cleanQueryForSearch(this.normalizeText(query));
    const normalizedOt = this.normalizeText(otValue);

    if (!normalizedQuery) return 0;
    return this.scoreSoft(normalizedQuery, normalizedOt);
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
