import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import otsData from '../../../assets/ots-demo.json';

interface OtItem {
    ot_numero: string;
    empresa: string;
    activo: string;
    fecha: string;
    tipo: string;
    motivo: string;
    trabajo_realizado: string;
    materiales: string[];
    responsable: string;
    ubicacion: string;
    observaciones: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

type QueryIntent = 'ot' | 'empresa' | 'activo' | 'unknown';
type GlobalMatchType = 'ot' | 'empresa' | 'activo';

interface RankedMatch {
    type: GlobalMatchType;
    value: string;
    score: number;
}

interface GlobalResolution {
    mode: 'single' | 'multiple' | 'none';
    match?: RankedMatch;
    matches?: RankedMatch[];
}

@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-widget.html',
    styleUrl: './chat-widget.scss'
})
export class ChatWidget {
    isOpen = false;
    userInput = '';

    messages: ChatMessage[] = [
        {
            role: 'assistant',
            text: 'Hola, soy Parks OT Assistant. Podés consultar por número de OT, empresa o activo. Ejemplos: "OT-001", "Aurora I", "órdenes de Río Norte".'
        }
    ];

    private ots: OtItem[] = (otsData as OtItem[]) ?? [];

    toggleChat(): void {
        this.isOpen = !this.isOpen;
    }

    sendMessage(): void {
        const raw = this.userInput.trim();

        if (!raw) return;

        this.messages.push({
            role: 'user',
            text: raw
        });

        const response = this.resolveQuery(raw);

        this.messages.push({
            role: 'assistant',
            text: response
        });

        this.userInput = '';
    }

    private resolveQuery(query: string): string {
        const parsed = this.parseQuery(query);
        const globalResolution = this.findBestGlobalMatch(query);

        if (globalResolution.mode === 'multiple' && globalResolution.matches) {
            return this.formatMultipleMatches('Detecté múltiples coincidencias:', globalResolution.matches);
        }

        if (parsed.intent === 'ot' && parsed.value) {
            const ot = this.findOtByNumber(parsed.value);

            if (!ot) {
                return `No encontré la ${parsed.value}. Probá con otro número de OT.`;
            }

            return this.formatSingleOt(ot);
        }

        if (parsed.intent === 'empresa') {
            const rankedCompanies = this.getBestMatches(query, 'empresa');

            if (rankedCompanies.length >= 2 && rankedCompanies[0].score >= 70 && rankedCompanies[1].score >= 70) {
                return this.formatMultipleMatches(
                    'Detecté múltiples coincidencias de empresas:',
                    rankedCompanies.slice(0, 4).map((item) => ({
                        type: 'empresa' as const,
                        value: item.value,
                        score: item.score
                    }))
                );
            }

            if (rankedCompanies.length > 0 && rankedCompanies[0].score >= 65) {
                const bestCompany = rankedCompanies[0].value;
                const results = this.ots.filter((item) => this.normalizeText(item.empresa) === this.normalizeText(bestCompany));

                return this.formatOtList(`Encontré ${results.length} orden(es) para la empresa "${bestCompany}":`, results);
            }
        }

        if (parsed.intent === 'activo') {
            const rankedAssets = this.getBestMatches(query, 'activo');

            if (rankedAssets.length >= 2 && rankedAssets[0].score >= 70 && rankedAssets[1].score >= 70) {
                return this.formatMultipleMatches(
                    'Detecté múltiples coincidencias de activos:',
                    rankedAssets.slice(0, 4).map((item) => ({
                        type: 'activo' as const,
                        value: item.value,
                        score: item.score
                    }))
                );
            }

            if (rankedAssets.length > 0 && rankedAssets[0].score >= 65) {
                const bestAsset = rankedAssets[0].value;
                const results = this.ots.filter((item) => this.normalizeText(item.activo) === this.normalizeText(bestAsset));

                return this.formatOtList(`Encontré ${results.length} orden(es) para el activo "${bestAsset}":`, results);
            }
        }

        if (globalResolution.mode === 'single' && globalResolution.match) {
            const globalResult = globalResolution.match;

            if (globalResult.type === 'ot') {
                const ot = this.findOtByNumber(globalResult.value);

                return ot ? this.formatSingleOt(ot) : 'Encontré una coincidencia probable, pero no pude resolverla correctamente.';
            }

            if (globalResult.type === 'empresa') {
                const results = this.ots.filter((item) => this.normalizeText(item.empresa) === this.normalizeText(globalResult.value));

                return this.formatOtList(`Tomé como mejor coincidencia la empresa "${globalResult.value}". Encontré ${results.length} orden(es):`, results);
            }

            if (globalResult.type === 'activo') {
                const results = this.ots.filter((item) => this.normalizeText(item.activo) === this.normalizeText(globalResult.value));

                return this.formatOtList(`Tomé como mejor coincidencia el activo "${globalResult.value}". Encontré ${results.length} orden(es):`, results);
            }
        }

        return 'No encontré resultados con esa consulta. Probá con una OT, una empresa o un activo. Ejemplos: "OT-002", "Aurora", "Río Norte", "Galerna".';
    }

    private parseQuery(query: string): {
        intent: QueryIntent;
        value: string | null;
        originalEntity: string;
    } {
        const normalizedQuery = this.normalizeText(query);

        const otMatch = this.extractOtNumber(query);
        if (otMatch) {
            return {
                intent: 'ot',
                value: otMatch,
                originalEntity: otMatch
            };
        }

        const asksForCompany = this.includesAny(normalizedQuery, ['empresa', 'empresas', 'cliente', 'clientes', 'naviera', 'compania', 'compañia', 'ordenes de', 'órdenes de', 'trabajos de']);

        const asksForAsset = this.includesAny(normalizedQuery, [
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
            'qué trabajos se hicieron en'
        ]);

        if (asksForCompany && !asksForAsset) {
            return {
                intent: 'empresa',
                value: null,
                originalEntity: ''
            };
        }

        if (asksForAsset && !asksForCompany) {
            return {
                intent: 'activo',
                value: null,
                originalEntity: ''
            };
        }

        const matchedCompany = this.matchKnownCompany(normalizedQuery);
        if (matchedCompany) {
            return {
                intent: 'empresa',
                value: matchedCompany,
                originalEntity: matchedCompany
            };
        }

        const matchedAsset = this.matchKnownAsset(normalizedQuery);
        if (matchedAsset) {
            return {
                intent: 'activo',
                value: matchedAsset,
                originalEntity: matchedAsset
            };
        }

        return {
            intent: 'unknown',
            value: null,
            originalEntity: ''
        };
    }

    private extractOtNumber(query: string): string | null {
        const match = query.match(/ot[\s-]*(\d{1,})/i);

        if (!match?.[1]) return null;

        const number = match[1].padStart(3, '0');
        return `OT-${number}`;
    }

    private findOtByNumber(otNumber: string): OtItem | undefined {
        const normalizedTarget = this.normalizeText(otNumber);

        return this.ots.find((item) => this.normalizeText(item.ot_numero) === normalizedTarget);
    }

    private matchKnownCompany(query: string): string | null {
        const companies = [...new Set(this.ots.map((item) => item.empresa))];

        for (const company of companies) {
            const normalizedCompany = this.normalizeText(company);

            if (query.includes(normalizedCompany) || normalizedCompany.includes(query)) {
                return company;
            }
        }

        return null;
    }

    private matchKnownAsset(query: string): string | null {
        const assets = [...new Set(this.ots.map((item) => item.activo))];

        for (const asset of assets) {
            const normalizedAsset = this.normalizeText(asset);

            if (query.includes(normalizedAsset) || normalizedAsset.includes(query)) {
                return asset;
            }
        }

        return null;
    }

    private getBestMatches(query: string, field: 'empresa' | 'activo'): Array<{ value: string; score: number }> {
        const cleanedQuery = this.extractRelevantQuery(this.normalizeText(query), field);
        const tokens = this.extractMeaningfulTokens(cleanedQuery);
        const values = [...new Set(this.ots.map((item) => item[field]))];

        return values
            .map((value) => ({
                value,
                score: this.scoreEntityWithTokens(tokens, this.normalizeText(value))
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
            score: this.scoreOtQuery(query, item.ot_numero)
        }));

        const companyCandidates: RankedMatch[] = [...new Set(this.ots.map((item) => item.empresa))].map((empresa) => ({
            type: 'empresa',
            value: empresa,
            score: this.scoreEntityWithTokens(tokens, this.normalizeText(empresa))
        }));

        const assetCandidates: RankedMatch[] = [...new Set(this.ots.map((item) => item.activo))].map((activo) => ({
            type: 'activo',
            value: activo,
            score: this.scoreEntityWithTokens(tokens, this.normalizeText(activo))
        }));

        const all = [...otCandidates, ...companyCandidates, ...assetCandidates].filter((item) => item.score >= 45).sort((a, b) => b.score - a.score);

        if (!all.length) {
            return { mode: 'none' };
        }

        const uniqueStrongMatches: RankedMatch[] = [];

        for (const item of all) {
            const alreadyExists = uniqueStrongMatches.some((existing) => existing.type === item.type && this.normalizeText(existing.value) === this.normalizeText(item.value));

            if (!alreadyExists && item.score >= 65) {
                uniqueStrongMatches.push(item);
            }
        }

        uniqueStrongMatches.sort((a, b) => b.score - a.score);

        if (uniqueStrongMatches.length >= 2) {
            return {
                mode: 'multiple',
                matches: uniqueStrongMatches.slice(0, 4)
            };
        }

        if (all[0].score < 65) {
            return { mode: 'none' };
        }

        return {
            mode: 'single',
            match: all[0]
        };
    }

    private scoreOtQuery(query: string, otValue: string): number {
        const extracted = this.extractOtNumber(query);
        if (extracted && this.normalizeText(extracted) === this.normalizeText(otValue)) {
            return 120;
        }

        const normalizedQuery = this.cleanQueryForSearch(this.normalizeText(query));
        const normalizedOt = this.normalizeText(otValue);

        if (!normalizedQuery) return 0;
        return this.scoreSoft(normalizedQuery, normalizedOt);
    }

    private scoreEntityWithTokens(tokens: string[], target: string): number {
        if (!tokens.length || !target) return 0;

        let score = 0;
        let matchedTokens = 0;
        let strongMatches = 0;

        for (const token of tokens) {
            const tokenScore = this.scoreTokenAgainstTarget(token, target);

            if (tokenScore > 0) {
                matchedTokens++;
                score += tokenScore;

                // 🔥 contamos matches fuertes (no palabras genéricas)
                if (token.length >= 4 && tokenScore >= 60) {
                    strongMatches++;
                }
            }
        }

        // ❌ si solo matchea 1 palabra débil → descartamos
        if (matchedTokens === 1 && strongMatches === 0) {
            return 0;
        }

        if (matchedTokens === 0) return 0;

        score += matchedTokens * 8;

        if (matchedTokens >= 2) score += 12;
        if (matchedTokens >= 3) score += 18;

        return score;
    }

    private scoreTokenAgainstTarget(token: string, target: string): number {
        if (!token || !target) return 0;

        if (token === target) return 100;
        if (target.startsWith(token)) return 85;
        if (target.includes(token)) return 70;

        const targetWords = target.split(' ').filter(Boolean);

        for (const word of targetWords) {
            if (word === token) return 75;
            if (word.startsWith(token)) return 60;
            if (token.length >= 4 && word.includes(token)) return 45;
            if (token.length >= 4 && word.length >= 4 && this.levenshtein(token, word) === 1) {
                return 35;
            }
        }

        return 0;
    }

    private scoreSoft(query: string, target: string): number {
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
                if (qWord === tWord) {
                    score += 25;
                } else if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) {
                    score += 18;
                } else if (tWord.includes(qWord) || qWord.includes(tWord)) {
                    score += 12;
                } else if (qWord.length >= 4 && tWord.length >= 4 && this.levenshtein(qWord, tWord) === 1) {
                    score += 10;
                }
            }
        }

        return score;
    }

    private extractMeaningfulTokens(query: string): string[] {
        const words = query.split(' ').filter((word) => word.length >= 3);
        const tokens = new Set<string>();

        for (const word of words) {
            tokens.add(word);
        }

        for (let i = 0; i < words.length - 1; i++) {
            const pair = `${words[i]} ${words[i + 1]}`.trim();
            if (pair.length >= 6) {
                tokens.add(pair);
            }
        }

        return [...tokens];
    }

    private levenshtein(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }

        return matrix[b.length][a.length];
    }

    private extractRelevantQuery(query: string, field: 'empresa' | 'activo'): string {
        const stopWordsCommon = [
            'mostrar',
            'mostrame',
            'muestrame',
            'buscar',
            'busca',
            'ver',
            'quiero',
            'quiero ver',
            'decime',
            'dame',
            'consultar',
            'consulta',
            'que',
            'qué',
            'cuales',
            'cuáles',
            'trabajos',
            'trabajo',
            'orden',
            'ordenes',
            'órdenes',
            'de',
            'del',
            'la',
            'las',
            'el',
            'los',
            'en',
            'se',
            'hicieron',
            'hizo'
        ];

        const stopWordsEmpresa = field === 'empresa' ? ['empresa', 'empresas', 'cliente', 'clientes', 'naviera', 'compania', 'compañia'] : ['activo', 'activos', 'barco', 'barcos', 'buque', 'buques', 'embarcacion', 'embarcaciones'];

        return this.removeStopWords(query, [...stopWordsCommon, ...stopWordsEmpresa]);
    }

    private cleanQueryForSearch(query: string): string {
        return this.removeStopWords(query, [
            'mostrar',
            'mostrame',
            'muestrame',
            'buscar',
            'busca',
            'ver',
            'quiero',
            'quiero ver',
            'decime',
            'dame',
            'consultar',
            'consulta',
            'que',
            'qué',
            'cuales',
            'cuáles',
            'trabajos',
            'trabajo',
            'orden',
            'ordenes',
            'órdenes',
            'de',
            'del',
            'la',
            'las',
            'el',
            'los',
            'en',
            'se',
            'hicieron',
            'hizo',
            'empresa',
            'empresas',
            'cliente',
            'clientes',
            'naviera',
            'compania',
            'compañia',
            'activo',
            'activos',
            'barco',
            'barcos',
            'buque',
            'buques',
            'embarcacion',
            'embarcaciones'
        ]);
    }

    private removeStopWords(query: string, stopWords: string[]): string {
        let cleaned = query;

        for (const word of stopWords) {
            const normalizedWord = this.normalizeText(word);
            const regex = new RegExp(`\\b${this.escapeRegex(normalizedWord)}\\b`, 'g');
            cleaned = cleaned.replace(regex, ' ');
        }

        return cleaned.replace(/\s+/g, ' ').trim();
    }

    private formatSingleOt(item: OtItem): string {
        const materialesTexto = item.materiales?.length ? item.materiales.join(', ') : 'Sin materiales registrados';

        return [
            `Resultado encontrado:`,
            ``,
            `OT: ${item.ot_numero}`,
            `Empresa: ${item.empresa}`,
            `Activo: ${item.activo}`,
            `Fecha: ${item.fecha}`,
            `Tipo: ${item.tipo}`,
            `Motivo: ${item.motivo}`,
            `Trabajo realizado: ${item.trabajo_realizado}`,
            `Materiales: ${materialesTexto}`,
            `Responsable: ${item.responsable}`,
            `Ubicación: ${item.ubicacion}`,
            `Observaciones: ${item.observaciones}`
        ].join('\n');
    }

    private formatOtList(title: string, items: OtItem[]): string {
        const limited = items.slice(0, 5);

        const lines = limited.map((item) => `• ${item.ot_numero} | ${item.activo} | ${item.empresa} | ${item.tipo}`);

        const extra = items.length > limited.length ? [``, `Y ${items.length - limited.length} resultado(s) más.`] : [];

        return [title, ``, ...lines, ...extra].join('\n');
    }

    private formatMultipleMatches(title: string, matches: RankedMatch[]): string {
        const lines = matches.map((match) => `• ${match.value} (${match.type})`);

        return [title, '', ...lines, '', 'Sé más específico para ver el detalle de una coincidencia.'].join('\n');
    }

    private normalizeText(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private includesAny(text: string, terms: string[]): boolean {
        return terms.some((term) => text.includes(this.normalizeText(term)));
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
