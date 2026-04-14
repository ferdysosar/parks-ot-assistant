import { ChatService } from './chat.service';

describe('ChatService dynamic queries', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
  });

  it('ordena por fecha desc cuando hay limite aunque no diga ultimas', () => {
    const response = service.resolveQuery('quiero ver 3 de rio norte');
    expect(response).toContain('OT-016');
    expect(response).toContain('OT-015');
    expect(response).toContain('OT-013');
    expect(response.indexOf('OT-016')).toBeLessThan(response.indexOf('OT-015'));
    expect(response.indexOf('OT-015')).toBeLessThan(response.indexOf('OT-013'));
  });

  it('resuelve fecha exacta dinamica', () => {
    const response = service.resolveQuery('que OTs se hicieron el 26/03/2026');
    expect(response).toContain('26/03/2026');
    expect(response).toContain('OT-011');
    expect(response).toContain('OT-012');
  });

  it('resuelve mes con conteo', () => {
    const response = service.resolveQuery('cuantas OTs hubo en julio');
    expect(response).toContain('En julio de 2026');
    expect(response).toContain('hubo 6 OTs');
  });

  it('usa default de ultimas 5 cuando no se especifica numero', () => {
    const response = service.resolveQuery('ultimas del aurora');
    expect(response).toContain('Mostrando las');
    expect(response).toContain('5 OTs de Aurora I');
  });

  it('muestra mensaje de insuficiencia cuando pide mas de las disponibles', () => {
    const response = service.resolveQuery('quiero ver 8 del aurora');
    expect(response).toContain('de las 8 solicitadas para Aurora I');
  });

  it('aplica interseccion empresa + activo en consulta dinamica combinada', () => {
    const response = service.resolveQuery('ultimas 5 de rio norte aurora');

    expect(response).toContain('OT-013');
    expect(response).toContain('OT-011');
    expect(response).toContain('OT-012');
    expect(response).toContain('OT-001');
    expect(response).toContain('OT-020');

    expect(response).not.toContain('Centinela');
    expect(response).not.toContain('OT-016');
    expect(response).not.toContain('OT-015');
  });

  it('soporta follow-up de cambio de ano', () => {
    service.resolveQuery('que OTs hubo en marzo');
    const response = service.resolveQuery('pero del 2025');
    expect(response).toContain('marzo de 2025');
  });

  it('soporta follow-up de cambio de mes', () => {
    service.resolveQuery('que OTs hubo en marzo');
    const response = service.resolveQuery('no, en julio');
    expect(response).toContain('julio de 2026');
  });

  it('soporta follow-up de cambio de cantidad', () => {
    service.resolveQuery('ultimas del aurora');
    const response = service.resolveQuery('quiero 10');
    expect(response).toContain('10');
    expect(response).toContain('Aurora I');
  });

  it('soporta follow-up de agregar entidad', () => {
    service.resolveQuery('que OTs hubo en marzo 2025');
    const response = service.resolveQuery('solo del aurora');
    expect(response).toContain('marzo de 2025');
    expect(response).toContain('Aurora I');
  });

  it('resuelve consulta parcial por ano con preposicion', () => {
    const response = service.resolveQuery('del 2025');
    expect(response).toContain('en 2025');
  });

  it('resuelve mes como input suelto', () => {
    const response = service.resolveQuery('marzo');
    expect(response).toContain('marzo de 2026');
  });

  it('resuelve activo parcial con solo', () => {
    const response = service.resolveQuery('solo aurora');
    expect(response).toContain('Aurora I');
  });

  it('responde guia FAQ para consulta por numero de OT', () => {
    const response = service.resolveQuery('como consulto una OT por numero');
    expect(response).toContain('consultar una OT por');
    expect(response).toContain('OT-001');
  });

  it('mantiene flujo operativo para consulta directa de OT', () => {
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('OT-001');
    expect(response).not.toContain('Para consultar una OT por número');
  });

  it('resuelve detalle como follow-up de OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('detalle');
    expect(response).toContain('OT-001');
    expect(response).toContain('Trabajo realizado');
  });

  it('resuelve que se hizo como follow-up de OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('que se hizo');
    expect(response).toContain('OT-001');
    expect(response).toContain('Trabajo realizado');
  });

  it('resuelve historial por activo en orden cronologico por defecto', () => {
    const response = service.resolveQuery('historial de aurora i');
    expect(response).toContain('Historial de "Aurora I"');
    expect(response).toContain('de más nuevo a más viejo');
    expect(response).toContain('OT-013');
  });

  it('permite cambiar orden a mas viejo primero en follow-up', () => {
    service.resolveQuery('historial de aurora i');
    const response = service.resolveQuery('de más viejo a más nuevo');
    expect(response).toContain('de más viejo a más nuevo');
    expect(response).toContain('OT-019');
    expect(response.indexOf('OT-019')).toBeLessThan(response.indexOf('OT-014'));
  });

  it('permite filtrar historial por ano usando contexto', () => {
    service.resolveQuery('historial de aurora i');
    const response = service.resolveQuery('solo 2025');
    expect(response).toContain('Aurora I');
    expect(response).toContain('en 2025');
    expect(response).toContain('OT-014');
    expect(response).toContain('OT-020');
  });

  it('resuelve la ultima OT usando contexto de historial', () => {
    service.resolveQuery('historial de centinela');
    const response = service.resolveQuery('y la ultima');
    expect(response).toContain('OT-016');
  });

  it('resuelve la ultima sobre contexto de ultimas N', () => {
    service.resolveQuery('ultimas 5 del aurora i');
    const response = service.resolveQuery('la ultima');
    expect(response).toContain('OT-013');
    expect(response).toContain('Resultado encontrado');
  });

  it('mantiene follow-ups de historial con orden y filtro de ano', () => {
    service.resolveQuery('historial de aurora i');
    const ordered = service.resolveQuery('de más viejo a más nuevo');
    expect(ordered).toContain('de más viejo a más nuevo');
    expect(ordered.indexOf('OT-019')).toBeLessThan(ordered.indexOf('OT-013'));

    const filtered = service.resolveQuery('solo 2025');
    expect(filtered).toContain('Historial de "Aurora I" en 2025');
    expect(filtered).toContain('OT-014');
    expect(filtered).toContain('OT-020');
    expect(filtered.indexOf('OT-014')).toBeLessThan(filtered.indexOf('OT-020'));
  });

  it('resuelve de forma coherente OT puntual seguido de y la ultima', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('detalle');
    const response = service.resolveQuery('y la ultima');
    expect(response).toContain('primero necesito una lista activa');
  });

  it('permite pasar de OT puntual a activo y luego pedir que se hizo', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('detalle');
    service.resolveQuery('aurora i');
    const response = service.resolveQuery('que se hizo');
    expect(response).toContain('Detalle de trabajos para el activo "Aurora I"');
    expect(response).toContain('OT-013');
  });

  it('resuelve que se hizo sobre una lista de ultimas', () => {
    service.resolveQuery('ultimas 5 del aurora i');
    const response = service.resolveQuery('que se hizo');
    expect(response).toContain('Detalle de trabajos para el activo "Aurora I"');
    expect(response).toContain('Trabajo:');
  });

  it('resuelve detalle sobre historial activo sin caer en fallback', () => {
    service.resolveQuery('historial de aurora i');
    const response = service.resolveQuery('detalle');
    expect(response).toContain('Detalle de trabajos del historial de "Aurora I"');
    expect(response).toContain('Trabajo:');
  });

  it('resuelve la ultima para lista por activo', () => {
    service.resolveQuery('aurora i');
    const response = service.resolveQuery('la ultima');
    expect(response).toContain('OT-013');
    expect(response).toContain('Resultado encontrado');
  });

  it('resuelve detalle para lista por empresa', () => {
    service.resolveQuery('empresa rio norte');
    const response = service.resolveQuery('detalle');
    expect(response).toContain('Detalle de trabajos para la empresa "Río Norte Logística"');
  });

  it('evita secuestrar cuando aparece una entidad nueva en follow-up', () => {
    service.resolveQuery('historial de aurora i');
    const response = service.resolveQuery('detalle de centinela');
    expect(response).toContain('Centinela');
    expect(response).not.toContain('historial de "Aurora I"');
  });

  it('resuelve materiales sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('materiales');
    expect(response).toContain('Materiales de OT-001');
    expect(response).toContain('terminales eléctricas');
  });

  it('resuelve responsable sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('responsable');
    expect(response).toContain('Responsable de OT-001');
    expect(response).toContain('Carlos Gómez');
  });

  it('resuelve ubicacion sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('ubicación');
    expect(response).toContain('Ubicación de OT-001');
    expect(response).toContain('Puerto Norte');
  });

  it('resuelve observaciones sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('observaciones');
    expect(response).toContain('Observaciones de OT-001');
    expect(response).toContain('Sistema en buen estado');
  });

  it('resuelve resumen sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('resumen');
    expect(response).toContain('Resumen de OT-001');
    expect(response).toContain('• Trabajo realizado:');
    expect(response).toContain('• Responsable:');
  });

  it('resuelve solo materiales sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('solo materiales');
    expect(response).toContain('Materiales de OT-001');
  });

  it('resuelve solo trabajo realizado sobre OT activa', () => {
    service.resolveQuery('OT-001');
    const response = service.resolveQuery('solo trabajo realizado');
    expect(response).toContain('Trabajo realizado en OT-001');
    expect(response).not.toContain('Responsable:');
  });

  it('prioriza consulta nueva explicita de ultimas sobre follow-up previo', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('solo trabajo realizado');
    const response = service.resolveQuery('últimas 5 del Aurora I');
    expect(response).toContain('Mostrando las últimas');
    expect(response).toContain('Aurora I');
    expect(response).not.toContain('primero necesito una lista activa');
  });

  it('prioriza consulta nueva explicita de historial sobre follow-up previo', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('materiales');
    const response = service.resolveQuery('historial de Aurora I');
    expect(response).toContain('Historial de "Aurora I"');
    expect(response).not.toContain('primero necesito una lista activa');
  });

  it('tolera typo simple en follow-up de ultima', () => {
    service.resolveQuery('historial de Aurora I');
    const response = service.resolveQuery('la útlima');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT-013');
  });

  it('mantiene follow-up de la ultima despues de nueva consulta de ultimas', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('últimas 5 del Aurora I');
    const response = service.resolveQuery('la última');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT-013');
  });

  it('prioriza OT explicita tras cadena con campo y lista activa', () => {
    service.resolveQuery('OT-001');
    service.resolveQuery('solo trabajo realizado');
    service.resolveQuery('últimas 5 del Aurora I');
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT: OT-001');
    expect(response).not.toContain('Mostrando las últimas');
  });

  it('prioriza OT explicita sobre lista activa', () => {
    service.resolveQuery('últimas 5 del Aurora I');
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT: OT-001');
  });

  it('prioriza historial explicito sobre lista activa', () => {
    service.resolveQuery('últimas 5 del Aurora I');
    const response = service.resolveQuery('historial del Aurora I');
    expect(response).toContain('Historial de "Aurora I"');
    expect(response).toContain('de más nuevo a más viejo');
  });

  it('prioriza OT explicita sobre historial activo', () => {
    service.resolveQuery('historial del Aurora I');
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT: OT-001');
  });

  it('prioriza OT explicita luego de ultima en historial', () => {
    service.resolveQuery('historial del Aurora I');
    service.resolveQuery('última');
    const response = service.resolveQuery('OT-001');
    expect(response).toContain('Resultado encontrado');
    expect(response).toContain('OT: OT-001');
  });
});
