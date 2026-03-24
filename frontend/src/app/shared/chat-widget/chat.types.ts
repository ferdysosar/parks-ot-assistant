export interface OtItem {
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

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export type QueryIntent = 'ot' | 'empresa' | 'activo' | 'unknown';
export type GlobalMatchType = 'ot' | 'empresa' | 'activo';

export interface RankedMatch {
    type: GlobalMatchType;
    value: string;
    score: number;
}

export interface GlobalResolution {
    mode: 'single' | 'multiple' | 'none';
    match?: RankedMatch;
    matches?: RankedMatch[];
}

export interface ChatContext {
    type: GlobalMatchType | null;
    value: string | null;
}
