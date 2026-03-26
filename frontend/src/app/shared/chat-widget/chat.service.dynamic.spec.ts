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
    expect(response).toContain('hubo 6 OT(s)');
  });

  it('usa default de últimas 5 cuando no se especifica número', () => {
    const response = service.resolveQuery('últimas del aurora');
    expect(response).toContain('Mostrando las últimas 5 OTs de Aurora I');
  });

  it('muestra mensaje de insuficiencia cuando pide más de las disponibles', () => {
    const response = service.resolveQuery('quiero ver 8 del aurora');
    expect(response).toContain('de las 8 solicitadas para Aurora I');
  });
});
