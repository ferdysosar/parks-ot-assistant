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

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
})
export class ChatWidget {
  isOpen = false;
  userInput = '';

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text:
        'Hola, soy Parks OT Assistant. Podés consultar por número de OT, empresa o activo. Ejemplos: "OT-001", "Aurora I", "órdenes de Río Norte".',
    },
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
      text: raw,
    });

    const response = this.resolveQuery(raw);

    this.messages.push({
      role: 'assistant',
      text: response,
    });

    this.userInput = '';
  }

  private resolveQuery(query: string): string {
    const parsed = this.parseQuery(query);

    if (parsed.intent === 'ot' && parsed.value) {
      const ot = this.findOtByNumber(parsed.value);

      if (!ot) {
        return `No encontré la ${parsed.value}. Probá con otro número de OT.`;
      }

      return this.formatSingleOt(ot);
    }

    if (parsed.intent === 'empresa' && parsed.value) {
      const results = this.findOtsByCompany(parsed.value);

      if (!results.length) {
        return `No encontré órdenes para la empresa "${parsed.originalEntity}".`;
      }

      return this.formatOtList(
        `Encontré ${results.length} orden(es) para la empresa "${results[0].empresa}":`,
        results
      );
    }

    if (parsed.intent === 'activo' && parsed.value) {
      const results = this.findOtsByAsset(parsed.value);

      if (!results.length) {
        return `No encontré órdenes para el activo "${parsed.originalEntity}".`;
      }

      return this.formatOtList(
        `Encontré ${results.length} orden(es) para el activo "${results[0].activo}":`,
        results
      );
    }

    const directOt = this.tryDirectOtMatch(query);
    if (directOt) {
      return this.formatSingleOt(directOt);
    }

    const companyResults = this.tryDirectCompanyMatch(query);
    if (companyResults.length) {
      return this.formatOtList(
        `Encontré ${companyResults.length} orden(es) asociadas a "${companyResults[0].empresa}":`,
        companyResults
      );
    }

    const assetResults = this.tryDirectAssetMatch(query);
    if (assetResults.length) {
      return this.formatOtList(
        `Encontré ${assetResults.length} orden(es) asociadas a "${assetResults[0].activo}":`,
        assetResults
      );
    }

    return 'No encontré resultados con esa consulta. Probá con una OT, una empresa o un activo. Ejemplos: "OT-002", "Aurora I", "Río Norte Logística".';
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
        originalEntity: otMatch,
      };
    }

    const matchedCompany = this.matchKnownCompany(normalizedQuery);
    const matchedAsset = this.matchKnownAsset(normalizedQuery);

    const asksForCompany = this.includesAny(normalizedQuery, [
      'empresa',
      'empresas',
      'cliente',
      'clientes',
      'naviera',
      'compania',
      'compañia',
      'ordenes de',
      'trabajos de',
    ]);

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
      'qué trabajos se hicieron en',
    ]);

    if (matchedCompany && !matchedAsset) {
      return {
        intent: 'empresa',
        value: this.normalizeText(matchedCompany),
        originalEntity: matchedCompany,
      };
    }

    if (matchedAsset && !matchedCompany) {
      return {
        intent: 'activo',
        value: this.normalizeText(matchedAsset),
        originalEntity: matchedAsset,
      };
    }

    if (matchedCompany && matchedAsset) {
      if (asksForAsset && !asksForCompany) {
        return {
          intent: 'activo',
          value: this.normalizeText(matchedAsset),
          originalEntity: matchedAsset,
        };
      }

      return {
        intent: 'empresa',
        value: this.normalizeText(matchedCompany),
        originalEntity: matchedCompany,
      };
    }

    const cleanedEntity = this.extractEntityCandidate(normalizedQuery);

    if (cleanedEntity) {
      const companyHits = this.findOtsByCompany(cleanedEntity);
      if (companyHits.length) {
        return {
          intent: 'empresa',
          value: cleanedEntity,
          originalEntity: cleanedEntity,
        };
      }

      const assetHits = this.findOtsByAsset(cleanedEntity);
      if (assetHits.length) {
        return {
          intent: 'activo',
          value: cleanedEntity,
          originalEntity: cleanedEntity,
        };
      }
    }

    return {
      intent: 'unknown',
      value: null,
      originalEntity: '',
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

    return this.ots.find((item) => {
      const current = this.normalizeText(item.ot_numero);
      return current === normalizedTarget;
    });
  }

  private findOtsByCompany(companyQuery: string): OtItem[] {
    const q = this.normalizeText(companyQuery);

    return this.ots.filter((item) =>
      this.normalizeText(item.empresa).includes(q)
    );
  }

  private findOtsByAsset(assetQuery: string): OtItem[] {
    const q = this.normalizeText(assetQuery);

    return this.ots.filter((item) =>
      this.normalizeText(item.activo).includes(q)
    );
  }

  private tryDirectOtMatch(query: string): OtItem | undefined {
    const q = this.normalizeText(query);

    return this.ots.find((item) => this.normalizeText(item.ot_numero).includes(q));
  }

  private tryDirectCompanyMatch(query: string): OtItem[] {
    const q = this.normalizeText(query);

    return this.ots.filter((item) =>
      this.normalizeText(item.empresa).includes(q)
    );
  }

  private tryDirectAssetMatch(query: string): OtItem[] {
    const q = this.normalizeText(query);

    return this.ots.filter((item) =>
      this.normalizeText(item.activo).includes(q)
    );
  }

  private matchKnownCompany(query: string): string | null {
    const companies = [...new Set(this.ots.map((item) => item.empresa))];

    for (const company of companies) {
      const normalizedCompany = this.normalizeText(company);

      if (
        query.includes(normalizedCompany) ||
        normalizedCompany.includes(query)
      ) {
        return company;
      }
    }

    return null;
  }

  private matchKnownAsset(query: string): string | null {
    const assets = [...new Set(this.ots.map((item) => item.activo))];

    for (const asset of assets) {
      const normalizedAsset = this.normalizeText(asset);

      if (
        query.includes(normalizedAsset) ||
        normalizedAsset.includes(query)
      ) {
        return asset;
      }
    }

    return null;
  }

  private extractEntityCandidate(normalizedQuery: string): string {
    let candidate = normalizedQuery;

    const stopWords = [
      'mostrar',
      'mostrame',
      'muestrame',
      'buscar',
      'busca',
      'ver',
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
      'ordenes de trabajo',
      'órdenes de trabajo',
      'ot',
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
      'barco',
      'buque',
      'activo',
      'empresa',
      'quiero',
      'mostrarme',
      'verme',
    ];

    for (const word of stopWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(this.normalizeText(word))}\\b`, 'g');
      candidate = candidate.replace(regex, ' ');
    }

    candidate = candidate.replace(/\s+/g, ' ').trim();

    return candidate;
  }

  private formatSingleOt(item: OtItem): string {
    const materialesTexto = item.materiales?.length
      ? item.materiales.join(', ')
      : 'Sin materiales registrados';

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
      `Observaciones: ${item.observaciones}`,
    ].join('\n');
  }

  private formatOtList(title: string, items: OtItem[]): string {
    const limited = items.slice(0, 5);

    const lines = limited.map(
      (item) =>
        `• ${item.ot_numero} | ${item.activo} | ${item.empresa} | ${item.tipo}`
    );

    const extra =
      items.length > limited.length
        ? [``, `Y ${items.length - limited.length} resultado(s) más.`]
        : [];

    return [title, ``, ...lines, ...extra].join('\n');
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