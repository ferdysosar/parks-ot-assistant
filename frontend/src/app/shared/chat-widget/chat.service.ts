import { Inject, Injectable, Optional } from '@angular/core';
import { OtDto } from '@/app/core/data/ot-contracts';
import { LocalJsonOtDataSource } from '@/app/core/data/local-json-ot-data-source';
import { OT_DATA_SOURCE, OtDataSource } from '@/app/core/data/ot-data-source';
import {
  ConversationState,
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
  formatHistoryOtList as utilFormatHistoryOtList,
  formatMultipleMatches as utilFormatMultipleMatches,
  formatOtList as utilFormatOtList,
  formatSingleOt as utilFormatSingleOt,
} from './chat-response-formatter';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private static readonly CONTINUATION_PAGE_SIZE = 5;
  private turnCounter = 0;
  private readonly dataSource: OtDataSource;
  private ots: OtItem[] = [];
  private session: ConversationState = this.createEmptySession();

  constructor(
    @Optional() @Inject(OT_DATA_SOURCE) dataSource: OtDataSource | null = null
  ) {
    this.dataSource = dataSource ?? new LocalJsonOtDataSource();
    const snapshot = this.dataSource.getChatSnapshot();
    this.ots = snapshot.ots.map((item) => this.mapDtoToOtItem(item));
  }

  resolveQuery(query: string): string {
    this.turnCounter++;
    const normalizedQuery = this.normalizeText(query);

    const parsed = this.parseQuery(query);

    // 1) Consulta explícita por OT: siempre gana sobre el contexto.
    if (parsed.intent === 'ot' && parsed.value) {
      const ot = this.findOtByNumber(parsed.value);

      if (!ot) {
        return [
          `No encontré una OT con el número ${parsed.value}.`,
          'Probá con otro número de OT o buscá por empresa, activo, fecha o período.',
          'Ejemplos: "OT-001", "OTs de una empresa", "OTs de un activo", "OTs de marzo 2025".',
        ].join('\n');
      }

      this.rememberOt(ot);
      return this.formatSingleOt(ot);
    }

    // 2) Consulta explícita de historial: siempre gana sobre el contexto.
    if (this.isHistoryRequest(normalizedQuery)) {
      const historyResponse = this.resolveHistoryRequest(query, normalizedQuery);
      if (historyResponse) return historyResponse;
    }

    // 3) Consulta explícita nueva de lista/dinámica.
    if (this.isStandaloneDynamicQuery(normalizedQuery)) {
      const dynamicResponse = this.resolveDynamicQuery(query, normalizedQuery, parsed);
      if (dynamicResponse) return dynamicResponse;
    }

    // 4) Follow-ups contextuales.
    const sessionFollowUp = this.resolveSessionFollowUp(query, normalizedQuery, parsed);
    if (sessionFollowUp) return sessionFollowUp;

    if (this.isGreetingQuery(normalizedQuery)) {
      return this.buildGreetingResponse();
    }

    const faqGuidance = this.resolveFaqGuidance(normalizedQuery);
    if (faqGuidance) {
      return faqGuidance;
    }

    const historyResponse = this.resolveHistoryRequest(query, normalizedQuery);
    if (historyResponse) {
      return historyResponse;
    }

    const dynamicResponse = this.resolveDynamicQuery(query, normalizedQuery, parsed);
    if (dynamicResponse) {
      return dynamicResponse;
    }

    const globalResolution = this.findBestGlobalMatch(query);
    if (globalResolution.mode === 'multiple' && globalResolution.matches) {
      this.session = this.createEmptySession();

      return this.formatMultipleMatches(
        'Detecté múltiples coincidencias:',
        globalResolution.matches
      );
    }

    if (parsed.intent === 'empresa') {
      const rankedCompanies = this.getBestMatches(query, 'empresa');

      if (
        rankedCompanies.length >= 2 &&
        rankedCompanies[0].score >= 70 &&
        rankedCompanies[1].score >= 70
      ) {
        this.session = this.createEmptySession();

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

        this.rememberList({
          mode: 'list',
          items: sortByFechaDesc(results),
          entityType: 'empresa',
          entityValue: bestCompany,
          sortOrder: 'desc',
        });

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          this.rememberOt(results[0]);
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
        this.session = this.createEmptySession();

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

        this.rememberList({
          mode: 'list',
          items: sortByFechaDesc(results),
          entityType: 'activo',
          entityValue: bestAsset,
          sortOrder: 'desc',
        });

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          this.rememberOt(results[0]);
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

        this.rememberOt(ot);
        return this.formatSingleOt(ot);
      }

      if (globalResult.type === 'empresa') {
        const results = this.ots.filter(
          (item) =>
            this.normalizeText(item.empresa) ===
            this.normalizeText(globalResult.value)
        );

        this.rememberList({
          mode: 'list',
          items: sortByFechaDesc(results),
          entityType: 'empresa',
          entityValue: globalResult.value,
          sortOrder: 'desc',
        });

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          this.rememberOt(results[0]);
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

        this.rememberList({
          mode: 'list',
          items: sortByFechaDesc(results),
          entityType: 'activo',
          entityValue: globalResult.value,
          sortOrder: 'desc',
        });

        if (this.isDetailRequest(normalizedQuery) && results.length === 1) {
          this.rememberOt(results[0]);
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

    return 'No pude encontrar resultados con ese mensaje. Probá con algo más específico, por ejemplo: "OT-011", "últimas 5 órdenes", "qué OTs se hicieron el 26/03/2026" o "qué OTs hubo en marzo 2025".';
  }

  private createEmptySession(): ConversationState {
    return {
      mode: 'idle',
      entityType: null,
      entityValue: null,
      activeOtNumber: null,
      activeList: [],
      sortOrder: 'desc',
      year: null,
      month: null,
      exactDateIso: null,
      latest: false,
      limit: null,
    };
  }

  private resolveSessionFollowUp(
    query: string,
    normalizedQuery: string,
    parsed: { intent: QueryIntent; value: string | null; originalEntity: string }
  ): string | null {
    if (this.session.mode === 'idle') return null;

    if (this.isLatestItemFollowUp(normalizedQuery)) {
      if (!this.session.activeList.length) {
        return 'Para responder "la última" primero necesito una lista activa. Ejemplo: "últimas 5 órdenes".';
      }

      const latest = sortByFechaDesc(this.session.activeList)[0];
      if (!latest) {
        return 'No tengo una lista activa válida para resolver "la última".';
      }

      this.rememberOt(latest);
      return this.formatSingleOt(latest);
    }

    if (this.session.mode === 'dynamic' && this.isListContinuationFollowUp(normalizedQuery)) {
      const continuedDynamicList = this.resolveDynamicListContinuation();
      if (continuedDynamicList) return continuedDynamicList;
    }

    if (this.session.mode === 'dynamic' && !this.isStandaloneDynamicQuery(normalizedQuery)) {
      const dynamicFollowUp = this.resolveDynamicFollowUp(query, normalizedQuery);
      if (dynamicFollowUp) return dynamicFollowUp;
    }

    const hasExplicitNewScope = this.hasExplicitNewScope(query, normalizedQuery, parsed);
    if (hasExplicitNewScope) return null;

    if (!this.isFollowUpCandidate(normalizedQuery)) return null;

    const requestedField = this.detectOtFieldRequest(normalizedQuery);
    if (requestedField && this.session.activeOtNumber) {
      const ot = this.findOtByNumber(this.session.activeOtNumber);
      if (!ot) {
        this.session = this.createEmptySession();
        return 'No tengo disponible la OT activa del contexto anterior.';
      }
      this.rememberOt(ot);
      return this.formatOtFieldResponse(ot, requestedField);
    }

    if (this.isOtDetailFollowUp(normalizedQuery) && this.session.activeOtNumber) {
      const ot = this.findOtByNumber(this.session.activeOtNumber);
      if (!ot) {
        this.session = this.createEmptySession();
        return 'No tengo disponible la OT activa del contexto anterior.';
      }
      this.rememberOt(ot);
      return this.formatSingleOt(ot);
    }

    if (this.session.mode === 'history' && this.isHistoryFollowUp(normalizedQuery)) {
      const nextSort = this.extractHistorySortOrder(normalizedQuery) ?? this.session.sortOrder;
      const nextYear =
        this.extractYearFromNormalizedQuery(normalizedQuery) !== null &&
        this.includesAny(normalizedQuery, ['solo', 'del', 'de'])
          ? this.extractYearFromNormalizedQuery(normalizedQuery)
          : this.session.year;
      const wantsLatest = this.includesAny(normalizedQuery, ['ultima', 'última']);

      return this.buildHistoryResponse({
        scopeEntity: this.session.entityValue as string,
        sortOrder: nextSort,
        year: nextYear,
        latestOnly: wantsLatest,
      });
    }

    if (this.isWorkRequest(normalizedQuery) || this.isDetailRequest(normalizedQuery)) {
      if (!this.session.activeList.length) {
        if (this.session.activeOtNumber) {
          const activeOt = this.findOtByNumber(this.session.activeOtNumber);
          if (activeOt) return this.formatSingleOt(activeOt);
        }
        return 'Necesito una OT o una lista activa para ampliar el detalle.';
      }

      const title = this.session.entityType === 'empresa'
        ? `Detalle de trabajos para la empresa "${this.session.entityValue}":`
        : this.session.mode === 'history'
            ? `Detalle de trabajos del historial de "${this.session.entityValue}":`
            : this.session.entityType === 'activo'
              ? `Detalle de trabajos para el activo "${this.session.entityValue}":`
            : 'Detalle de trabajos de la lista actual:';

      return this.formatDetailedOtList(title, this.session.activeList);
    }

    return null;
  }

  private isFollowUpCandidate(normalizedQuery: string): boolean {
    return (
      this.detectOtFieldRequest(normalizedQuery) !== null ||
      this.isOtDetailFollowUp(normalizedQuery) ||
      this.isLatestItemFollowUp(normalizedQuery) ||
      this.isHistoryFollowUp(normalizedQuery) ||
      this.isWorkRequest(normalizedQuery) ||
      this.isDetailRequest(normalizedQuery)
    );
  }

  private isListContinuationFollowUp(normalizedQuery: string): boolean {
    const compact = normalizedQuery.trim().replace(/\s+/g, ' ');
    return (
      /^(?:y\s+)?el\s+resto\??$/.test(compact) ||
      /^(?:mostrame|mostrarme)\s+mas\??$/.test(compact) ||
      /^segui\??$/.test(compact) ||
      /^las\s+demas\??$/.test(compact) ||
      /^las\s+otras\??$/.test(compact) ||
      /^(?:y\s+)?despues\??$/.test(compact)
    );
  }

  private resolveDynamicListContinuation(): string | null {
    if (this.session.mode !== 'dynamic') return null;
    if (!this.session.activeList.length) return null;
    if (!this.session.latest && this.session.limit === null) return null;

    const fullResults = this.rebuildDynamicBaseResultsFromSession();
    if (!fullResults.length) {
      this.session = this.createEmptySession();
      return 'No tengo resultados disponibles para continuar esa lista.';
    }

    const currentCount = this.session.activeList.length;
    if (currentCount >= fullResults.length) {
      return 'No hay más OTs para este criterio.';
    }

    const nextCount = Math.min(
      currentCount + ChatService.CONTINUATION_PAGE_SIZE,
      fullResults.length
    );
    const nextChunk = fullResults.slice(currentCount, nextCount);
    if (!nextChunk.length) {
      return 'No hay más OTs para este criterio.';
    }

    const continuationEntityType =
      this.session.entityType === 'empresa' ||
      this.session.entityType === 'activo' ||
      this.session.entityType === 'periodo'
        ? this.session.entityType
        : null;

    this.rememberList({
      mode: 'dynamic',
      items: fullResults.slice(0, nextCount),
      entityType: continuationEntityType,
      entityValue: this.session.entityValue,
      sortOrder: this.session.sortOrder,
      year: this.session.year,
      month: this.session.month,
      exactDateIso: this.session.exactDateIso,
      latest: this.session.latest,
      limit: nextCount,
    });

    return this.formatOtList(
      `Mostrando ${nextChunk.length} ${this.otCountLabel(nextChunk.length)} más (${nextCount} de ${fullResults.length}):`,
      nextChunk
    );
  }

  private rebuildDynamicBaseResultsFromSession(): OtItem[] {
    let results = this.ots;

    if (
      this.session.entityType === 'empresa' &&
      this.session.entityValue
    ) {
      results = results.filter(
        (item) =>
          this.normalizeText(item.empresa) === this.normalizeText(this.session.entityValue as string)
      );
    } else if (
      this.session.entityType === 'activo' &&
      this.session.entityValue
    ) {
      results = results.filter(
        (item) =>
          this.normalizeText(item.activo) === this.normalizeText(this.session.entityValue as string)
      );
    }

    if (this.session.exactDateIso) {
      results = filterByExactDate(results, this.session.exactDateIso);
      return sortByFechaDesc(results);
    }

    if (this.session.month !== null && this.session.year !== null) {
      results = filterByMonthYear(results, this.session.month, this.session.year);
      return sortByFechaDesc(results);
    }

    if (this.session.year !== null) {
      results = filterByYear(results, this.session.year);
      return sortByFechaDesc(results);
    }

    return sortByFechaDesc(results);
  }

  private hasExplicitNewScope(
    query: string,
    normalizedQuery: string,
    parsed: { intent: QueryIntent; value: string | null; originalEntity: string }
  ): boolean {
    if (parsed.intent === 'ot' && parsed.value) return true;
    if (this.isHistoryRequest(normalizedQuery)) return true;
    if (this.isStandaloneDynamicQuery(normalizedQuery)) return true;
    if (parseDynamicQueryMeta(query, this.ots).hasDynamicRequest) return true;

    const bestCompany = this.getBestMatches(query, 'empresa')[0];
    const bestAsset = this.getBestMatches(query, 'activo')[0];
    if (bestCompany && bestCompany.score >= 70) return true;
    if (bestAsset && bestAsset.score >= 70) return true;

    return false;
  }

  private isOtDetailFollowUp(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'detalle',
      'detalles',
      'informacion',
      'información',
      'mas informacion',
      'más información',
      'info',
      'que se hizo',
      'qué se hizo',
      'trabajos realizados',
      'trabajo realizado',
    ]);
  }

  private isLatestItemFollowUp(normalizedQuery: string): boolean {
    const compact = normalizedQuery.trim().replace(/\s+/g, ' ');
    return /^(?:y\s+)?(?:la\s+)?(?:ultima|utlima)$/.test(compact);
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
      'que se hizo',
      'qué se hizo',
      'que trabajos',
      'qué trabajos',
      'trabajos realizados',
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

  private rememberOt(ot: OtItem): void {
    this.session = {
      ...this.session,
      mode: 'single',
      entityType: 'ot',
      entityValue: ot.ot_numero,
      activeOtNumber: ot.ot_numero,
      activeList: [],
      exactDateIso: null,
      month: null,
      year: null,
      latest: false,
      limit: null,
    };
  }

  private detectOtFieldRequest(
    normalizedQuery: string
  ):
    | 'trabajo_realizado'
    | 'materiales'
    | 'responsable'
    | 'ubicacion'
    | 'observaciones'
    | 'motivo'
    | 'tipo'
    | 'empresa'
    | 'activo'
    | 'fecha'
    | 'resumen'
    | null {
    if (
      this.includesAny(normalizedQuery, [
        'resumen',
      ])
    ) {
      return 'resumen';
    }

    if (
      this.includesAny(normalizedQuery, [
        'que se hizo',
        'qué se hizo',
        'trabajo realizado',
        'trabajos realizados',
        'solo trabajo realizado',
        'solo trabajos realizados',
      ])
    ) {
      return 'trabajo_realizado';
    }

    if (this.includesAny(normalizedQuery, ['materiales', 'solo materiales', 'material'])) {
      return 'materiales';
    }

    if (this.includesAny(normalizedQuery, ['responsable', 'solo responsable'])) {
      return 'responsable';
    }

    if (this.includesAny(normalizedQuery, ['ubicacion', 'ubicación', 'solo ubicacion', 'solo ubicación'])) {
      return 'ubicacion';
    }

    if (this.includesAny(normalizedQuery, ['observaciones', 'solo observaciones', 'observacion', 'observación'])) {
      return 'observaciones';
    }

    if (this.includesAny(normalizedQuery, ['motivo', 'solo motivo'])) {
      return 'motivo';
    }

    if (this.includesAny(normalizedQuery, ['tipo', 'solo tipo'])) {
      return 'tipo';
    }

    if (this.includesAny(normalizedQuery, ['empresa', 'compania', 'compañia', 'solo empresa'])) {
      return 'empresa';
    }

    if (this.includesAny(normalizedQuery, ['activo', 'barco', 'buque', 'solo activo'])) {
      return 'activo';
    }

    if (this.includesAny(normalizedQuery, ['fecha', 'solo fecha'])) {
      return 'fecha';
    }

    return null;
  }

  private formatOtFieldResponse(
    ot: OtItem,
    field:
      | 'trabajo_realizado'
      | 'materiales'
      | 'responsable'
      | 'ubicacion'
      | 'observaciones'
      | 'motivo'
      | 'tipo'
      | 'empresa'
      | 'activo'
      | 'fecha'
      | 'resumen'
  ): string {
    if (field === 'resumen') {
      const materiales = ot.materiales?.length
        ? ot.materiales.join(', ')
        : 'Sin materiales registrados';
      return [
        `Resumen de ${ot.ot_numero}:`,
        `• Activo: ${ot.activo}`,
        `• Empresa: ${ot.empresa}`,
        `• Fecha: ${ot.fecha}`,
        `• Tipo: ${ot.tipo}`,
        `• Motivo: ${ot.motivo}`,
        `• Trabajo realizado: ${ot.trabajo_realizado}`,
        `• Responsable: ${ot.responsable}`,
        `• Materiales: ${materiales}`,
      ].join('\n');
    }

    if (field === 'materiales') {
      const materiales = ot.materiales?.length
        ? ot.materiales.join(', ')
        : 'Sin materiales registrados';
      return `Materiales de ${ot.ot_numero}: ${materiales}`;
    }

    if (field === 'trabajo_realizado') {
      return `Trabajo realizado en ${ot.ot_numero}: ${ot.trabajo_realizado}`;
    }

    if (field === 'responsable') {
      return `Responsable de ${ot.ot_numero}: ${ot.responsable}`;
    }

    if (field === 'ubicacion') {
      return `Ubicación de ${ot.ot_numero}: ${ot.ubicacion}`;
    }

    if (field === 'observaciones') {
      return `Observaciones de ${ot.ot_numero}: ${ot.observaciones}`;
    }

    if (field === 'motivo') {
      return `Motivo de ${ot.ot_numero}: ${ot.motivo}`;
    }

    if (field === 'empresa') {
      return `Empresa de ${ot.ot_numero}: ${ot.empresa}`;
    }

    if (field === 'activo') {
      return `Activo de ${ot.ot_numero}: ${ot.activo}`;
    }

    if (field === 'fecha') {
      return `Fecha de ${ot.ot_numero}: ${ot.fecha}`;
    }

    return `Tipo de ${ot.ot_numero}: ${ot.tipo}`;
  }

  private rememberList(params: {
    mode: 'list' | 'history' | 'dynamic';
    items: OtItem[];
    entityType: 'activo' | 'empresa' | 'periodo' | null;
    entityValue: string | null;
    sortOrder?: 'asc' | 'desc';
    year?: number | null;
    month?: number | null;
    exactDateIso?: string | null;
    latest?: boolean;
    limit?: number | null;
  }): void {
    this.session = {
      ...this.session,
      mode: params.mode,
      entityType: params.entityType,
      entityValue: params.entityValue,
      activeOtNumber: null,
      activeList: params.items,
      sortOrder: params.sortOrder ?? this.session.sortOrder,
      year: params.year ?? null,
      month: params.month ?? null,
      exactDateIso: params.exactDateIso ?? null,
      latest: params.latest ?? false,
      limit: params.limit ?? null,
    };
  }

  resetConversationContext(): void {
    this.turnCounter = 0;
    this.session = this.createEmptySession();
  }

  private resolveHistoryRequest(
    query: string,
    normalizedQuery: string
  ): string | null {
    if (!this.isHistoryRequest(normalizedQuery)) return null;

    let scopeEntity: string | null = null;
    const rankedAssets = this.getBestMatches(query, 'activo');
    if (rankedAssets.length > 0 && rankedAssets[0].score >= 65) {
      scopeEntity = rankedAssets[0].value;
    }

    if (
      !scopeEntity &&
      this.session.entityType === 'activo' &&
      this.session.entityValue &&
      this.includesAny(normalizedQuery, ['este barco', 'este activo', 'ese barco', 'ese activo'])
    ) {
      scopeEntity = this.session.entityValue;
    }

    if (!scopeEntity) {
      return 'Para armar el historial necesito que indiques el activo/barco. Ejemplo: "historial de un activo".';
    }

    const year = this.extractYearFromNormalizedQuery(normalizedQuery);
    const sortOrder = this.extractHistorySortOrder(normalizedQuery) ?? 'desc';
    const wantsLatest = this.includesAny(normalizedQuery, ['ultima', 'última']);

    return this.buildHistoryResponse({
      scopeEntity,
      sortOrder,
      year,
      latestOnly: wantsLatest,
    });
  }

  private isHistoryRequest(normalizedQuery: string): boolean {
    return this.includesAny(normalizedQuery, [
      'historial de',
      'historial del',
      'mostrame todo lo que se hizo en',
      'muestrame todo lo que se hizo en',
      'todo lo que se hizo en',
    ]);
  }

  private isHistoryFollowUp(normalizedQuery: string): boolean {
    if (this.extractHistorySortOrder(normalizedQuery)) return true;
    if (this.includesAny(normalizedQuery, ['y la ultima', 'y la última', 'la ultima', 'la última'])) return true;

    const hasYear = this.extractYearFromNormalizedQuery(normalizedQuery) !== null;
    const hasYearCue = this.includesAny(normalizedQuery, ['solo', 'del', 'de']);
    return hasYear && hasYearCue;
  }

  private extractHistorySortOrder(normalizedQuery: string): 'asc' | 'desc' | null {
    if (
      this.includesAny(normalizedQuery, [
        'de mas viejo a mas nuevo',
        'de más viejo a más nuevo',
        'mas viejo a mas nuevo',
        'más viejo a más nuevo',
        'ascendente',
      ])
    ) {
      return 'asc';
    }

    if (
      this.includesAny(normalizedQuery, [
        'de mas nuevo a mas viejo',
        'de más nuevo a más viejo',
        'mas nuevo a mas viejo',
        'más nuevo a más viejo',
        'descendente',
      ])
    ) {
      return 'desc';
    }

    return null;
  }

  private extractYearFromNormalizedQuery(normalizedQuery: string): number | null {
    const yearMatch = normalizedQuery.match(/\b(19\d{2}|20\d{2})\b/);
    return yearMatch ? Number(yearMatch[1]) : null;
  }
  private buildHistoryResponse(params: {
    scopeEntity: string;
    sortOrder: 'asc' | 'desc';
    year: number | null;
    latestOnly: boolean;
  }): string {
    const { scopeEntity, sortOrder, year, latestOnly } = params;
    let results = this.ots.filter(
      (item) => this.normalizeText(item.activo) === this.normalizeText(scopeEntity)
    );

    if (year !== null) {
      results = filterByYear(results, year);
    }

    results = sortOrder === 'asc' ? this.sortByFechaAsc(results) : sortByFechaDesc(results);

    if (!results.length) {
      this.session = this.createEmptySession();
      if (year !== null) {
        return `No encontré OTs para el activo "${scopeEntity}" en ${year}.`;
      }
      return `No encontré OTs para el activo "${scopeEntity}".`;
    }

    if (latestOnly) {
      const latestOt = sortByFechaDesc(results)[0];
      if (!latestOt) {
        return `No encontré OTs para el activo "${scopeEntity}".`;
      }
      this.rememberOt(latestOt);
      return this.formatSingleOt(latestOt);
    }

    const orderLabel =
      sortOrder === 'asc' ? 'de más viejo a más nuevo' : 'de más nuevo a más viejo';
    const yearLabel = year !== null ? ` en ${year}` : '';
    const title = `Historial de "${scopeEntity}"${yearLabel} (${orderLabel}):`;
    this.rememberList({
      mode: 'history',
      items: results,
      entityType: 'activo',
      entityValue: scopeEntity,
      sortOrder,
      year,
      latest: false,
      limit: null,
    });
    return this.formatHistoryOtList(title, results);
  }
  private sortByFechaAsc(items: OtItem[]): OtItem[] {
    return [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));
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
      'Podés consultar por número de OT, empresa, activo o período.',
      'Ejemplos: "OT-001", "OTs de una empresa", "historial de un activo".',
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
        'Ejemplo: "qué OTs tiene la empresa [nombre empresa]".',
      ].join('\n');
    }

    if (this.matchesFaqTopic(normalizedQuery, ['activo', 'barco', 'buque', 'embarcacion'])) {
      return [
        'Podés buscar OTs por activo mencionando el activo en la consulta.',
        'Ejemplo: "qué OTs tiene el activo [nombre activo]".',
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
    const hasConversationalContext =
      this.session.mode !== 'idle' ||
      !!this.session.activeOtNumber ||
      this.session.activeList.length > 0;
    if (hasConversationalContext) return false;

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
      `No pude interpretar bien "${q}".`,
      '',
      'Probá con algo como:',
      '• "OT-001"',
      '• "OTs de una empresa"',
      '• "historial de un activo"',
      '• "OTs de marzo 2025"',
    ].join('\n');
  }

  private resolveDynamicFollowUp(query: string, normalizedQuery: string): string | null {
    if (this.session.mode !== 'dynamic') return null;
    if (this.isStandaloneDynamicQuery(normalizedQuery)) return null;

    const patch = this.extractDynamicFollowUpPatch(query, normalizedQuery);
    if (!patch.hasPatch) return null;

    const next = {
      exactDateIso: this.session.exactDateIso,
      month: this.session.month,
      year: this.session.year,
      asksCount: false,
      latest: this.session.latest,
      limit: this.session.limit,
      scopeType:
        this.session.entityType === 'empresa' || this.session.entityType === 'activo'
          ? this.session.entityType
          : null,
      scopeEntity:
        this.session.entityType === 'empresa' || this.session.entityType === 'activo'
          ? this.session.entityValue
          : null,
    };

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
      /\bcuantas?\b|\bcuantos?\b|\b(?:en\s+)?total\b|\bcual\s+es\s+el\s+total\b/.test(normalizedQuery)
        ? true
        : null;
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
    const companyHint = this.findTokenHintEntity(query, 'empresa');
    const assetHint = this.findTokenHintEntity(query, 'activo');
    const hintedCompany = bestCompany?.value ?? companyHint?.value ?? null;
    const hintedAsset = bestAsset?.value ?? assetHint?.value ?? null;
    const companyStrong = !!bestCompany && bestCompany.score >= 65;
    const assetStrong = !!bestAsset && bestAsset.score >= 65;
    const companyScopeEntity = companyStrong ? bestCompany.value : null;
    const assetScopeEntity = assetStrong ? bestAsset.value : null;

    // Si hay señales claras de empresa y activo al mismo tiempo, pedimos desambiguar
    // para evitar decisiones silenciosas por phrasing.
    const companyDominatesWithClearName =
      !!companyHint &&
      !!assetHint &&
      companyHint.matchedTokenCount >= 2 &&
      assetHint.matchedTokenCount === 1 &&
      assetHint.maxMatchedTokenLength <= 3;

    const assetDominatesWithClearName =
      !!companyHint &&
      !!assetHint &&
      assetHint.matchedTokenCount >= 2 &&
      companyHint.matchedTokenCount === 1 &&
      companyHint.maxMatchedTokenLength <= 3;

    if (
      parsed.intent === 'unknown' &&
      hintedCompany &&
      hintedAsset &&
      this.normalizeText(hintedCompany) !== this.normalizeText(hintedAsset) &&
      !companyDominatesWithClearName &&
      !assetDominatesWithClearName
    ) {
      this.session = this.createEmptySession();
      return [
        'Detecté una ambigüedad entre empresa y activo en tu consulta.',
        `¿Querés buscar por empresa ("${hintedCompany}") o por activo ("${hintedAsset}")?`,
      ].join('\n');
    }

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

    if (companyScopeEntity) {
      scoped = scoped.filter(
        (it) => this.normalizeText(it.empresa) === this.normalizeText(companyScopeEntity)
      );
    }

    if (assetScopeEntity) {
      scoped = scoped.filter(
        (it) => this.normalizeText(it.activo) === this.normalizeText(assetScopeEntity)
      );
    } else if (scopeEntity && scopeType === 'empresa') {
      scoped = this.ots.filter(
        (it) => this.normalizeText(it.empresa) === this.normalizeText(scopeEntity as string)
      );
    } else if (scopeEntity && scopeType === 'activo') {
      scoped = this.ots.filter(
        (it) => this.normalizeText(it.activo) === this.normalizeText(scopeEntity as string)
      );
    }

    const rememberDynamicList = (
      items: OtItem[],
      year: number | null,
      exactDateIso: string | null,
      latest: boolean,
      limit: number | null
    ): void => {
      this.rememberList({
        mode: 'dynamic',
        items,
        entityType: scopeType ?? 'periodo',
        entityValue: scopeEntity,
        sortOrder: 'desc',
        year,
        month: meta.month,
        exactDateIso,
        latest,
        limit,
      });
    };

    let results = scoped;

    if (meta.exactDateIso) {
      results = filterByExactDate(results, meta.exactDateIso);
      const displayDate = formatIsoDateToDisplay(meta.exactDateIso);
      if (!results.length) {
        this.session = this.createEmptySession();
        return `No encontré OTs para la fecha ${displayDate}.`;
      }
      rememberDynamicList(sortByFechaDesc(results), null, meta.exactDateIso, false, null);
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
        rememberDynamicList(results, meta.year, null, false, null);
        return `En ${monthLabel} de ${meta.year}${defaultYearMsg} hubo ${results.length} ${this.otCountLabel(results.length)}.`;
      }

      if (!results.length) {
        this.session = this.createEmptySession();
        return `No encontré OTs en ${monthLabel} de ${meta.year}${defaultYearMsg}.`;
      }

      rememberDynamicList(results, meta.year, null, false, null);
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
        rememberDynamicList(results, meta.year, null, false, null);
        return `En ${meta.year} hubo ${results.length} ${this.otCountLabel(results.length)}.`;
      }

      if (!results.length) {
        this.session = this.createEmptySession();
        return `No encontré OTs en ${meta.year}.`;
      }

      rememberDynamicList(results, meta.year, null, false, null);
      return this.formatOtList(
        `Encontré ${results.length} ${this.otCountLabel(results.length)} en ${meta.year}:`,
        results
      );
    }

    // "últimas" sin número => default 5
    if (meta.latest && !meta.limit) {
      const defaultLatest = 5;
      const latestResults = sortByFechaDesc(results).slice(0, defaultLatest);
      if (!latestResults.length) {
        this.session = this.createEmptySession();
        return 'No encontré resultados para esa consulta.';
      }

      const title = this.buildDynamicLimitedTitle({
        found: latestResults.length,
        requested: defaultLatest,
        latest: true,
        scopeEntity,
      });
      rememberDynamicList(latestResults, null, null, true, defaultLatest);
      return this.formatOtList(title, latestResults);
    }

    if (meta.latest || meta.limit) {
      results = sortByFechaDesc(results);
    }

    if (meta.limit) {
      const limited = results.slice(0, meta.limit);
      if (!limited.length) {
        this.session = this.createEmptySession();
        return 'No encontré resultados para esa consulta.';
      }

      const title = this.buildDynamicLimitedTitle({
        found: limited.length,
        requested: meta.limit,
        latest: meta.latest,
        scopeEntity,
      });
      rememberDynamicList(limited, null, null, !!meta.latest, meta.limit);
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

  private findTokenHintEntity(
    query: string,
    field: 'empresa' | 'activo'
  ): { value: string; score: number; matchedTokenCount: number; maxMatchedTokenLength: number } | null {
    const cleanedQuery = this.extractRelevantQuery(this.normalizeText(query), field);
    const tokens = this.extractMeaningfulTokens(cleanedQuery);
    if (!tokens.length) return null;

    const values = [...new Set(this.ots.map((item) => item[field]))];
    let best: {
      value: string;
      score: number;
      matchedTokenCount: number;
      maxMatchedTokenLength: number;
    } | null = null;

    for (const value of values) {
      const normalizedValue = this.normalizeText(value);
      let score = 0;
      let matched = 0;
      let maxMatchedTokenLength = 0;

      for (const token of tokens) {
        const tokenScore = this.scoreTokenAgainstTarget(token, normalizedValue);
        if (tokenScore >= 60) {
          score += tokenScore;
          matched++;
          if (token.length > maxMatchedTokenLength) {
            maxMatchedTokenLength = token.length;
          }
        }
      }

      if (!matched) continue;
      if (!best || score > best.score) {
        best = { value, score, matchedTokenCount: matched, maxMatchedTokenLength };
      }
    }

    return best;
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

  private formatHistoryOtList(title: string, items: OtItem[]): string {
    return utilFormatHistoryOtList(title, items);
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

  private mapDtoToOtItem(item: OtDto): OtItem {
    return {
      ot_numero: item.otNumber,
      empresa: item.companyName,
      activo: item.assetName,
      fecha: item.workDate,
      tipo: item.workType,
      motivo: item.reason,
      trabajo_realizado: item.workPerformed,
      materiales: item.materials,
      responsable: item.responsible,
      ubicacion: item.location,
      observaciones: item.observations ?? '',
    };
  }
}






