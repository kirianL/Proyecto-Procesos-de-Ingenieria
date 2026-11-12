import {
  calcularResumenIndicadores,
  construirSolicitudConDetalles,
  consultarDetalleSolicitudAutorizado,
  enriquecerEventosHistorial,
  METAS_ACADEMICAS_ODS12,
} from "./consultas";
import {
  HISTORIAL_INICIAL,
  repositorio,
  SOLICITUDES_INICIALES,
  USUARIOS_INICIALES,
} from "./persistencia";
import { registrarSolicitud, transicionarEstadoSolicitud } from "./solicitudes";
import type {
  Estado,
  EventoConAutor,
  IndicadoresResumen,
  Prioridad,
  Solicitud,
  SolicitudConDetalles,
  Usuario,
} from "./types";

export { HISTORIAL_INICIAL, SOLICITUDES_INICIALES, USUARIOS_INICIALES };

export function getUsuarios(): Usuario[] {
  return repositorio.obtenerUsuarios();
}

export function getUsuarioPorId(id: string): Usuario | undefined {
  return repositorio.obtenerUsuarioPorId(id);
}

export function getUsuarioActual(): Usuario {
  const user = repositorio.obtenerUsuarioPorId(
    repositorio.obtenerUsuarioActualId(),
  );
  return user ?? USUARIOS_INICIALES[0];
}

export function setUsuarioActual(id: string): Usuario {
  const user = repositorio.obtenerUsuarioPorId(id);
  if (user) {
    repositorio.establecerUsuarioActualId(user.id);
    return user;
  }
  return USUARIOS_INICIALES[0];
}

export function getSolicitudesPorCreador(creadorId: string): Solicitud[] {
  return repositorio
    .obtenerSolicitudes()
    .filter((s) => s.creadorId === creadorId)
    .sort(
      (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
    );
}

export function getBandejaMantenimiento(
  filtro?: Estado | "TODAS",
): Solicitud[] {
  let list = repositorio.obtenerSolicitudes();
  if (filtro && filtro !== "TODAS") {
    list = list.filter((s) => s.estado === filtro);
  }
  return list.sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  );
}

export function getDetalleSolicitud(
  id: string,
): SolicitudConDetalles | undefined {
  const sol = repositorio.obtenerSolicitudPorId(id);
  if (!sol) return undefined;
  return construirSolicitudConDetalles(sol);
}

/**
 * Consulta autorizada de detalle que aplica RN-05 / RNF02 (CP04 / CS03).
 */
export function getDetalleSolicitudSegura(
  id: string,
  usuario: Usuario = getUsuarioActual(),
): SolicitudConDetalles {
  return consultarDetalleSolicitudAutorizado(usuario, id);
}

export function crearSolicitud(params: {
  creadorId: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  prioridad?: Prioridad;
}): Solicitud {
  const usuario = repositorio.obtenerUsuarioPorId(params.creadorId);
  return registrarSolicitud({
    usuario,
    titulo: params.titulo,
    descripcion: params.descripcion,
    ubicacion: params.ubicacion,
    prioridad: params.prioridad,
  });
}

export function cambiarEstadoSolicitud(params: {
  solicitudId: string;
  autorId: string;
  nuevoEstado: Estado;
  nota: string;
}): Solicitud {
  const usuario = repositorio.obtenerUsuarioPorId(params.autorId);
  return transicionarEstadoSolicitud({
    usuario,
    solicitudId: params.solicitudId,
    nuevoEstado: params.nuevoEstado,
    nota: params.nota,
  });
}

export function getHistorialSolicitud(solicitudId: string): EventoConAutor[] {
  return enriquecerEventosHistorial(solicitudId);
}

export function getIndicadores(): IndicadoresResumen {
  return calcularResumenIndicadores();
}

/**
 * Datos de referencia para que Skullet mida las plantillas reales antes de que
 * se resuelva el estado de cada pantalla, garantizando 0px de salto de layout.
 */
export const SOLICITUDES_MUESTRA: Solicitud[] = SOLICITUDES_INICIALES;

export const INDICADORES_MUESTRA: IndicadoresResumen = {
  totales: 7,
  abiertas: 3,
  enProceso: 2,
  cerradas: 4,
  tiempoMedioHoras: 38.5,
  porEstado: {
    REGISTRADA: 1,
    EN_PROCESO: 2,
    CERRADA: 4,
  },
  porcentajeCumplimiento: 57,
  metasAcademicas: METAS_ACADEMICAS_ODS12,
  esSimulado: true,
};

export const DETALLE_MUESTRA: SolicitudConDetalles = {
  ...SOLICITUDES_INICIALES[1],
  creador: {
    id: USUARIOS_INICIALES[0].id,
    nombre: USUARIOS_INICIALES[0].nombre,
    correo: USUARIOS_INICIALES[0].correo,
    rol: USUARIOS_INICIALES[0].rol,
    departamento: USUARIOS_INICIALES[0].departamento,
  },
  historial: [
    {
      ...HISTORIAL_INICIAL[1],
      autor: {
        nombre: USUARIOS_INICIALES[0].nombre,
        rol: USUARIOS_INICIALES[0].rol,
        cargo: USUARIOS_INICIALES[0].cargo,
      },
    },
    {
      ...HISTORIAL_INICIAL[2],
      autor: {
        nombre: USUARIOS_INICIALES[2].nombre,
        rol: USUARIOS_INICIALES[2].rol,
        cargo: USUARIOS_INICIALES[2].cargo,
      },
    },
  ],
};
