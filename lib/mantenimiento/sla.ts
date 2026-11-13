import type { Prioridad, Solicitud } from "./types";

export const SLA_META_HORAS: Record<Prioridad, number> = {
  URGENTE: 2,
  ALTA: 8,
  MEDIA: 24,
  BAJA: 48,
};

export type EstadoSla =
  | "EN_MARGEN"
  | "POR_VENCER"
  | "EXCEDIDO"
  | "CUMPLIDO"
  | "INCUMPLIDO";

export interface ResultadoSla {
  objetivoHoras: number;
  transcurridoHoras: number;
  restanteHoras: number;
  porcentajeConsumido: number;
  segmentosActivos: number;
  estadoSla: EstadoSla;
  etiquetaEstado: string;
  etiquetaCorta: string;
  etiquetaDetalle: string;
}

function formatearDuracion(horasAbs: number): string {
  if (horasAbs < 1) {
    const mins = Math.max(1, Math.round(horasAbs * 60));
    return `${mins}m`;
  }
  if (horasAbs < 24) {
    const redondeado = Math.round(horasAbs * 10) / 10;
    return `${Number.isInteger(redondeado) ? redondeado : redondeado.toFixed(1)}h`;
  }
  const dias = Math.floor(horasAbs / 24);
  const horasResto = Math.round(horasAbs - dias * 24);
  return horasResto > 0 ? `${dias}d ${horasResto}h` : `${dias}d`;
}

export function calcularEstadoSla(
  solicitud: Pick<
    Solicitud,
    "prioridad" | "estado" | "creadaEn" | "cerradaEn"
  >,
  ahoraMs: number = Date.now(),
): ResultadoSla {
  const objetivoHoras = SLA_META_HORAS[solicitud.prioridad] ?? 24;
  const inicioMs = new Date(solicitud.creadaEn).getTime();
  const finMs =
    solicitud.estado === "CERRADA" && solicitud.cerradaEn
      ? new Date(solicitud.cerradaEn).getTime()
      : ahoraMs;

  const transcurridoMs = Math.max(0, finMs - inicioMs);
  const transcurridoHoras = Math.round((transcurridoMs / 3600000) * 10) / 10;
  const restanteHoras =
    Math.round((objetivoHoras - transcurridoHoras) * 10) / 10;

  const ratio = transcurridoHoras / objetivoHoras;
  const porcentajeConsumido = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  const segmentosActivos = Math.min(
    12,
    Math.max(1, Math.round((porcentajeConsumido / 100) * 12)),
  );

  if (solicitud.estado === "CERRADA") {
    const cumplido = transcurridoHoras <= objetivoHoras;
    return {
      objetivoHoras,
      transcurridoHoras,
      restanteHoras,
      porcentajeConsumido,
      segmentosActivos,
      estadoSla: cumplido ? "CUMPLIDO" : "INCUMPLIDO",
      etiquetaEstado: cumplido ? "Cumplido en tiempo" : "Fuera de SLA",
      etiquetaCorta: cumplido
        ? `En meta · ${formatearDuracion(transcurridoHoras)}`
        : `SLA +${formatearDuracion(Math.abs(restanteHoras))}`,
      etiquetaDetalle: cumplido
        ? `Resuelta en ${formatearDuracion(transcurridoHoras)} sobre límite de ${objetivoHoras}h`
        : `Cerrada ${formatearDuracion(Math.abs(restanteHoras))} después del límite de ${objetivoHoras}h`,
    };
  }

  if (restanteHoras <= 0) {
    return {
      objetivoHoras,
      transcurridoHoras,
      restanteHoras,
      porcentajeConsumido: 100,
      segmentosActivos: 12,
      estadoSla: "EXCEDIDO",
      etiquetaEstado: "SLA excedido",
      etiquetaCorta: `SLA +${formatearDuracion(Math.abs(restanteHoras))}`,
      etiquetaDetalle: `Excedido por ${formatearDuracion(Math.abs(restanteHoras))} respecto a la meta de ${objetivoHoras}h`,
    };
  }

  if (ratio >= 0.72) {
    return {
      objetivoHoras,
      transcurridoHoras,
      restanteHoras,
      porcentajeConsumido,
      segmentosActivos,
      estadoSla: "POR_VENCER",
      etiquetaEstado: "Por vencer",
      etiquetaCorta: `Restan ${formatearDuracion(restanteHoras)}`,
      etiquetaDetalle: `Quedan ${formatearDuracion(restanteHoras)} para cumplir la meta de ${objetivoHoras}h`,
    };
  }

  return {
    objetivoHoras,
    transcurridoHoras,
    restanteHoras,
    porcentajeConsumido,
    segmentosActivos,
    estadoSla: "EN_MARGEN",
    etiquetaEstado: "En margen",
    etiquetaCorta: `Restan ${formatearDuracion(restanteHoras)}`,
    etiquetaDetalle: `${formatearDuracion(transcurridoHoras)} transcurridas de ${objetivoHoras}h disponibles`,
  };
}

