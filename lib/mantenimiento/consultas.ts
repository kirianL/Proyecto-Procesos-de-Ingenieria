import {
  verificarAccesoSolicitud,
  verificarRolPermitido,
  verificarSesionActiva,
} from "./auth";
import { repositorio } from "./persistencia";
import {
  DominioError,
  type Estado,
  type EventoConAutor,
  type IndicadoresResumen,
  type MetasAcademicasODS12,
  type Solicitud,
  type SolicitudConDetalles,
  type Usuario,
} from "./types";

export const METAS_ACADEMICAS_ODS12: MetasAcademicasODS12 = {
  tiempoMedio: { baseHoras: 72, metaHoras: 48 },
  satisfaccion: { basePorcentaje: 60, metaPorcentaje: 80 },
  formulariosFisicosMes: { base: 40, meta: 10, ods: "ODS 12.5" },
};

export function enriquecerEventosHistorial(
  solicitudId: string,
): EventoConAutor[] {
  return repositorio
    .obtenerEventosPorSolicitud(solicitudId)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((evt) => {
      const autor = repositorio.obtenerUsuarioPorId(evt.autorId);
      return {
        ...evt,
        autor: {
          nombre: autor?.nombre ?? "Personal",
          rol: autor?.rol ?? "EMPLEADO",
          cargo: autor?.cargo ?? "Personal",
        },
      };
    });
}

export function construirSolicitudConDetalles(
  sol: Solicitud,
): SolicitudConDetalles {
  const creador = repositorio.obtenerUsuarioPorId(sol.creadorId) ?? {
    id: sol.creadorId,
    nombre: "Usuario Desconocido",
    correo: "desconocido@ejemplo.test",
    rol: "EMPLEADO" as const,
    departamento: "General",
  };

  return {
    ...sol,
    creador: {
      id: creador.id,
      nombre: creador.nombre,
      correo: creador.correo,
      rol: creador.rol,
      departamento: creador.departamento,
    },
    historial: enriquecerEventosHistorial(sol.id),
  };
}

/**
 * RF02 / RN-05 / CP03: Lista exclusivamente las solicitudes creadas por el usuario en sesión.
 */
export function consultarMisSolicitudes(
  usuario: Usuario | null | undefined,
): Solicitud[] {
  verificarSesionActiva(usuario);

  return repositorio
    .obtenerSolicitudes()
    .filter((s) => s.creadorId === usuario.id)
    .sort(
      (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
    );
}

/**
 * RF03 / CP05 / CP06: Consulta la bandeja global de mantenimiento con filtro de estado y orden temporal.
 * Restringido a TECNICO (y lectura para JEFATURA); rechaza EMPLEADO con 403.
 */
export function consultarBandejaMantenimiento(
  usuario: Usuario | null | undefined,
  filtro?: Estado | "TODAS",
): Solicitud[] {
  verificarRolPermitido(usuario, ["TECNICO", "JEFATURA"]);

  let lista = repositorio.obtenerSolicitudes();
  if (filtro && filtro !== "TODAS") {
    lista = lista.filter((s) => s.estado === filtro);
  }

  return lista.sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  );
}

/**
 * RF02 / RF05 / CP04 / CS03: Obtiene el detalle de una solicitud verificando en servidor
 * que el solicitante sea propietario (si es EMPLEADO) o personal autorizado (TECNICO / JEFATURA).
 */
export function consultarDetalleSolicitudAutorizado(
  usuario: Usuario | null | undefined,
  id: string,
): SolicitudConDetalles {
  verificarSesionActiva(usuario);

  const sol = repositorio.obtenerSolicitudPorId(id);
  if (!sol) {
    throw new DominioError("Solicitud no encontrada.", "NO_ENCONTRADO", 404);
  }

  verificarAccesoSolicitud(usuario, sol);

  return construirSolicitudConDetalles(sol);
}

/**
 * RF05 / CP09 / CS03: Obtiene la secuencia cronológica de eventos de historial
 * aplicando exactamente las mismas reglas de autorización que el detalle.
 */
export function consultarHistorialAutorizado(
  usuario: Usuario | null | undefined,
  solicitudId: string,
): EventoConAutor[] {
  const detalle = consultarDetalleSolicitudAutorizado(usuario, solicitudId);
  return detalle.historial;
}

export function calcularResumenIndicadores(): IndicadoresResumen {
  const solicitudes = repositorio.obtenerSolicitudes();
  const totales = solicitudes.length;
  const registradas = solicitudes.filter(
    (s) => s.estado === "REGISTRADA",
  ).length;
  const enProceso = solicitudes.filter((s) => s.estado === "EN_PROCESO").length;
  const cerradas = solicitudes.filter((s) => s.estado === "CERRADA").length;
  const abiertas = registradas + enProceso;

  const solicitudesCerradas = solicitudes.filter(
    (s) => s.estado === "CERRADA" && s.cerradaEn,
  );

  let tiempoTotalHoras = 0;
  for (const sol of solicitudesCerradas) {
    if (!sol.cerradaEn) continue;
    const inicio = new Date(sol.creadaEn).getTime();
    const fin = new Date(sol.cerradaEn).getTime();
    const horas = Math.max(1, (fin - inicio) / (1000 * 60 * 60));
    tiempoTotalHoras += horas;
  }

  const tiempoMedioHoras =
    solicitudesCerradas.length > 0
      ? Number((tiempoTotalHoras / solicitudesCerradas.length).toFixed(1))
      : 24.0;

  const porcentajeCumplimiento =
    totales > 0 ? Math.round((cerradas / totales) * 100) : 0;

  return {
    totales,
    abiertas,
    enProceso,
    cerradas,
    tiempoMedioHoras,
    porEstado: {
      REGISTRADA: registradas,
      EN_PROCESO: enProceso,
      CERRADA: cerradas,
    },
    porcentajeCumplimiento,
    metasAcademicas: METAS_ACADEMICAS_ODS12,
    esSimulado: true,
  };
}

/**
 * RF05 / RN-07 / CP10: Consulta agregada de indicadores para JEFATURA (solo lectura).
 */
export function consultarIndicadoresAutorizado(
  usuario: Usuario | null | undefined,
): IndicadoresResumen {
  verificarRolPermitido(usuario, ["JEFATURA"]);
  return calcularResumenIndicadores();
}
