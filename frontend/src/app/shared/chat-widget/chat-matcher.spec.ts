import { findBestGlobalMatch, getBestMatches, scoreOtQuery } from './chat-matcher';
import { OtItem } from './chat.types';

describe('chat-matcher', () => {
  const ots: OtItem[] = [
    {
      ot_numero: 'OT-001',
      empresa: 'Río Norte Logística',
      activo: 'Aurora I',
      fecha: '2026-03-10',
      tipo: 'Preventivo',
      motivo: 'x',
      trabajo_realizado: 'x',
      materiales: [],
      responsable: 'x',
      ubicacion: 'x',
      observaciones: 'x',
    },
    {
      ot_numero: 'OT-002',
      empresa: 'Hidrovía Central S.A.',
      activo: 'Horizonte',
      fecha: '2026-03-12',
      tipo: 'Correctivo',
      motivo: 'x',
      trabajo_realizado: 'x',
      materiales: [],
      responsable: 'x',
      ubicacion: 'x',
      observaciones: 'x',
    },
  ];

  it('rankea Aurora I como mejor activo para "aurora"', () => {
    const ranked = getBestMatches('aurora', 'activo', ots);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].value).toBe('Aurora I');
  });

  it('resuelve match global single para OT exacta', () => {
    const result = findBestGlobalMatch('OT-001', ots);
    expect(result.mode).toBe('single');
    expect(result.match?.type).toBe('ot');
    expect(result.match?.value).toBe('OT-001');
  });

  it('scoreOtQuery premia match exacto de OT', () => {
    const score = scoreOtQuery('ot 1', 'OT-001');
    expect(score).toBeGreaterThanOrEqual(100);
  });
});
