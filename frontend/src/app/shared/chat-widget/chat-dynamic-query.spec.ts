import {
  filterByExactDate,
  filterByMonthYear,
  formatIsoDateToDisplay,
  monthName,
  parseDynamicQueryMeta,
  sortByFechaDesc,
} from './chat-dynamic-query';
import { OtItem } from './chat.types';

describe('chat-dynamic-query', () => {
  const ots: OtItem[] = [
    {
      ot_numero: 'OT-001',
      empresa: 'Río Norte Logística',
      activo: 'Aurora I',
      fecha: '2026-07-21',
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
      empresa: 'Río Norte Logística',
      activo: 'Aurora I',
      fecha: '2025-03-26',
      tipo: 'Correctivo',
      motivo: 'x',
      trabajo_realizado: 'x',
      materiales: [],
      responsable: 'x',
      ubicacion: 'x',
      observaciones: 'x',
    },
  ];

  it('detecta límite dinámico sin palabras OT/orden', () => {
    const meta = parseDynamicQueryMeta('quiero ver 4 de río norte', ots);
    expect(meta.limit).toBe(4);
  });

  it('detecta fecha exacta dd/mm/yyyy', () => {
    const meta = parseDynamicQueryMeta('qué OTs se hicieron el 26/03/2026', ots);
    expect(meta.exactDateIso).toBe('2026-03-26');
  });

  it('activa hasDynamicRequest con latest o asksCount', () => {
    const m1 = parseDynamicQueryMeta('últimas del aurora', ots);
    const m2 = parseDynamicQueryMeta('cuántas OTs hubo en julio', ots);
    expect(m1.hasDynamicRequest).toBeTrue();
    expect(m2.hasDynamicRequest).toBeTrue();
  });

  it('filtra por mes/año y ordena desc', () => {
    const july = filterByMonthYear(ots, 7, 2026);
    expect(july.length).toBe(1);
    const sorted = sortByFechaDesc(ots);
    expect(sorted[0].fecha).toBe('2026-07-21');
  });

  it('formatea fecha ISO para UI', () => {
    expect(formatIsoDateToDisplay('2026-03-26')).toBe('26/03/2026');
    expect(monthName(7)).toBe('julio');
  });

  it('filtra por fecha exacta ISO', () => {
    const result = filterByExactDate(ots, '2025-03-26');
    expect(result.length).toBe(1);
    expect(result[0].ot_numero).toBe('OT-002');
  });
});
