import { parseQuery } from './chat-intent.parser';
import { OtItem } from './chat.types';

describe('chat-intent.parser', () => {
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
  ];

  it('parsea OT numérica y completa padding', () => {
    const parsed = parseQuery('ver ot 7', ots);
    expect(parsed.intent).toBe('ot');
    expect(parsed.value).toBe('OT-007');
  });

  it('detecta intención de empresa por keywords', () => {
    const parsed = parseQuery('órdenes de Río Norte Logística', ots);
    expect(parsed.intent).toBe('empresa');
    expect(parsed.value).toBeNull();
  });

  it('detecta intención de activo por keywords', () => {
    const parsed = parseQuery('trabajos en Aurora I', ots);
    expect(parsed.intent).toBe('activo');
    expect(parsed.value).toBeNull();
  });

  it('detecta activo conocido cuando no hay keywords de intención', () => {
    const parsed = parseQuery('Aurora I', ots);
    expect(parsed.intent).toBe('activo');
    expect(parsed.value).toBe('Aurora I');
  });

  it('devuelve unknown cuando no hay match', () => {
    const parsed = parseQuery('consulta sin entidad', ots);
    expect(parsed.intent).toBe('unknown');
  });
});
