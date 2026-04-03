import { ChatService } from './chat.service';

describe('ChatService dynamic queries', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
  });

  it('ordena por fecha desc cuando hay límite aunque no diga "últimas"', () => {
    const response = service.resolveQuery('quiero ver 3 de río norte');
    expect(response).toContain('OT-016');
    expect(response).toContain('OT-015');
    expect(response).toContain('OT-013');
    expect(response.indexOf('OT-016')).toBeLessThan(response.indexOf('OT-015'));
    expect(response.indexOf('OT-015')).toBeLessThan(response.indexOf('OT-013'));
  });

  it('resuelve fecha exacta dinámica', () => {
    const response = service.resolveQuery('qué OTs se hicieron el 26/03/2026');
    expect(response).toContain('26/03/2026');
    expect(response).toContain('OT-011');
    expect(response).toContain('OT-012');
  });

  it('resuelve mes con conteo', () => {
    const response = service.resolveQuery('cuántas OTs hubo en julio');
    expect(response).toContain('En julio de 2026');
    expect(response).toContain('hubo 6 OTs');
  });

  it('usa default de últimas 5 cuando no se especifica número', () => {
    const response = service.resolveQuery('últimas del aurora');
    expect(response).toContain('Mostrando las últimas 5 OTs de Aurora I');
  });

  it('muestra mensaje de insuficiencia cuando pide más de las disponibles', () => {
    const response = service.resolveQuery('quiero ver 8 del aurora');
    expect(response).toContain('de las 8 solicitadas para Aurora I');
  });

  it('soporta follow-up de cambio de año', () => {
    service.resolveQuery('qué OTs hubo en marzo');
    const response = service.resolveQuery('pero del 2025');
    expect(response).toContain('marzo de 2025');
  });

  it('soporta follow-up de cambio de mes', () => {
    service.resolveQuery('qué OTs hubo en marzo');
    const response = service.resolveQuery('no, en julio');
    expect(response).toContain('julio de 2026');
  });

  it('soporta follow-up de cambio de cantidad', () => {
    service.resolveQuery('últimas del aurora');
    const response = service.resolveQuery('quiero 10');
    expect(response).toContain('10');
    expect(response).toContain('Aurora I');
  });

  it('soporta follow-up de agregar entidad', () => {
    service.resolveQuery('qué OTs hubo en marzo 2025');
    const response = service.resolveQuery('solo del aurora');
    expect(response).toContain('marzo de 2025');
    expect(response).toContain('Aurora I');
  });
  it('resuelve consulta parcial por año con preposición', () => {
    const response = service.resolveQuery('del 2025');
    expect(response).toContain('en 2025');
  });

  it('resuelve mes como input suelto', () => {
    const response = service.resolveQuery('marzo');
    expect(response).toContain('marzo de 2026');
  });

  it('resuelve activo parcial con "solo"', () => {
    const response = service.resolveQuery('solo aurora');
    expect(response).toContain('Aurora I');
  });

  it('responde guia FAQ para consulta por numero de OT', () => {
    const response = service.resolveQuery('como consulto una OT por numero');
    expect(response).toContain('consultar una OT por número');
    expect(response).toContain('OT-001');
  });

  it('mantiene flujo operativo para consulta directa de OT', () => {
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('OT-001');
    expect(response).not.toContain('Para consultar una OT por número');
  });
});

