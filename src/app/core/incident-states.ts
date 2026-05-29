/** Valid next states per doc 00 §5 */
export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ['BUSCANDO_TALLER', 'CANCELADO'],
  BUSCANDO_TALLER: ['TALLER_ASIGNADO', 'NO_ATENDIDO', 'CANCELADO'],
  TALLER_ASIGNADO: ['EN_CAMINO', 'BUSCANDO_TALLER'],
  EN_CAMINO: ['EN_ATENCION'],
  EN_ATENCION: ['FINALIZADO'],
  FINALIZADO: ['PAGADO'],
};

export function nextStatesFor(current: string): string[] {
  return INCIDENT_TRANSITIONS[current] ?? [];
}

export const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  BUSCANDO_TALLER: 'Buscando taller',
  TALLER_ASIGNADO: 'Taller asignado',
  EN_CAMINO: 'En camino',
  EN_ATENCION: 'En atención',
  FINALIZADO: 'Finalizado',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
  NO_ATENDIDO: 'No atendido',
};
