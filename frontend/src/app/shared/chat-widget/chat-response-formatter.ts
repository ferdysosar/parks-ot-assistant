import { OtItem, RankedMatch } from './chat.types';

export function formatSingleOt(item: OtItem): string {
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

export function formatOtList(title: string, items: OtItem[]): string {
  const limited = items.slice(0, 5);

  const lines = limited.map(
    (item) => `• ${item.ot_numero} | ${item.activo} | ${item.empresa} | ${item.tipo}`
  );

  const extra =
    items.length > limited.length
      ? [``, `Y ${items.length - limited.length} resultado(s) más.`]
      : [];

  return [title, ``, ...lines, ...extra].join('\n');
}

export function formatDetailedOtList(title: string, items: OtItem[]): string {
  const limited = items.slice(0, 3);

  const lines = limited.flatMap((item) => {
    const trabajo = item.trabajo_realizado || 'Sin detalle cargado';
    return [
      `• ${item.ot_numero} | ${item.activo} | ${item.tipo}`,
      `  Trabajo: ${trabajo}`,
    ];
  });

  const extra =
    items.length > limited.length
      ? [``, `Y ${items.length - limited.length} resultado(s) más.`]
      : [];

  return [title, ``, ...lines, ...extra].join('\n');
}

export function formatHistoryOtList(title: string, items: OtItem[]): string {
  const lines = items.map(
    (item) => `• ${item.fecha} | ${item.ot_numero} | ${item.tipo} | ${item.empresa}`
  );

  return [title, ``, ...lines].join('\n');
}

export function formatMultipleMatches(title: string, matches: RankedMatch[]): string {
  const lines = matches.map((match) => `• ${match.value} (${match.type})`);

  return [
    title,
    '',
    ...lines,
    '',
    'Sé más específico para ver el detalle de una coincidencia.',
  ].join('\n');
}

