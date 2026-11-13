export const ROLES = ["EMPLEADO", "TECNICO", "JEFATURA"] as const;
export type Rol = (typeof ROLES)[number];

export const ESTADOS = ["REGISTRADA", "EN_PROCESO", "CERRADA"] as const;
export type Estado = (typeof ESTADOS)[number];

export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "URGENTE"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const TRANSICIONES_VALIDAS: Record<Estado, Estado[]> = {
  REGISTRADA: ["EN_PROCESO"],
  EN_PROCESO: ["CERRADA"],
  CERRADA: [],
};

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  cargo: string;
  departamento: string;
}

export interface AdjuntoEvidencia {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamanoBytes: number;
  etapa: "REPORTE" | "ATENCION";
  creadoEn: string;
}

export interface Solicitud {
  id: string;
  creadorId: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  estado: Estado;
  prioridad: Prioridad;
  creadaEn: string;
  cerradaEn: string | null;
  adjuntos?: AdjuntoEvidencia[];
}

export interface EventoHistorial {
  id: string;
  solicitudId: string;
  autorId: string;
  estadoPrevio: Estado | null;
  estadoNuevo: Estado;
  nota: string | null;
  fecha: string;
  adjuntos?: AdjuntoEvidencia[];
}

/**
 * Entidad opcional VALORACION (Tabla 14 del documento de arquitectura).
 * Reservada para evolución o piloto; no es función obligatoria del MVP.
 */
export interface Valoracion {
  id: string;
  solicitudId: string;
  calificacion: 1 | 2 | 3 | 4 | 5;
  comentario?: string | null;
  fecha: string;
}

export interface SolicitudConDetalles extends Solicitud {
  creador: Pick<Usuario, "id" | "nombre" | "correo" | "rol" | "departamento">;
  historial: EventoConAutor[];
}

export interface EventoConAutor extends EventoHistorial {
  autor: Pick<Usuario, "nombre" | "rol" | "cargo">;
}

export interface MetasAcademicasODS12 {
  tiempoMedio: { baseHoras: number; metaHoras: number };
  satisfaccion: { basePorcentaje: number; metaPorcentaje: number };
  formulariosFisicosMes: { base: number; meta: number; ods: string };
}

export interface IndicadoresResumen {
  totales: number;
  abiertas: number;
  enProceso: number;
  cerradas: number;
  tiempoMedioHoras: number;
  porEstado: Record<Estado, number>;
  porcentajeCumplimiento: number;
  metasAcademicas: MetasAcademicasODS12;
  esSimulado: boolean;
}

export type CodigoErrorDominio =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "VALIDACION_FALLIDA"
  | "TRANSICION_INVALIDA"
  | "ERROR_TRANSACCIONAL";

export class DominioError extends Error {
  readonly codigo: CodigoErrorDominio;
  readonly status: 400 | 401 | 403 | 404 | 422 | 500;

  constructor(
    mensaje: string,
    codigo: CodigoErrorDominio,
    status: 400 | 401 | 403 | 404 | 422 | 500,
  ) {
    super(mensaje);
    this.name = "DominioError";
    this.codigo = codigo;
    this.status = status;
  }
}
