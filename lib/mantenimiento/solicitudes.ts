import { verificarRolPermitido, verificarSesionActiva } from "./auth";
import { adaptadorCorreoStub } from "./notificaciones";
import { ejecutarTransaccion, repositorio } from "./persistencia";
import {
  DominioError,
  type Estado,
  type EventoHistorial,
  PRIORIDADES,
  type Prioridad,
  type Solicitud,
  TRANSICIONES_VALIDAS,
  type Usuario,
} from "./types";

export interface CrearSolicitudInput {
  usuario: Usuario | null | undefined;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  prioridad?: Prioridad;
}

export interface CambiarEstadoInput {
  usuario: Usuario | null | undefined;
  solicitudId: string;
  nuevoEstado: Estado;
  nota: string;
}

/**
 * RF01 / RN-01 / CP01 / CP02: Registra una nueva solicitud validando identidad,
 * rol EMPLEADO y campos obligatorios en una operación transaccional con su evento inicial.
 */
export function registrarSolicitud(input: CrearSolicitudInput): Solicitud {
  verificarSesionActiva(input.usuario);
  const creador = verificarRolPermitido(input.usuario, ["EMPLEADO"]);

  const titulo = input.titulo?.trim() ?? "";
  const descripcion = input.descripcion?.trim() ?? "";
  const ubicacion = input.ubicacion?.trim() ?? "";

  if (!titulo) {
    throw new DominioError(
      "El título de la solicitud es obligatorio.",
      "VALIDACION_FALLIDA",
      422,
    );
  }
  if (!descripcion) {
    throw new DominioError(
      "La descripción detallada es obligatoria.",
      "VALIDACION_FALLIDA",
      422,
    );
  }
  if (!ubicacion) {
    throw new DominioError(
      "La ubicación del requerimiento es obligatoria.",
      "VALIDACION_FALLIDA",
      422,
    );
  }

  const prioridad: Prioridad =
    input.prioridad && PRIORIDADES.includes(input.prioridad)
      ? input.prioridad
      : "MEDIA";

  const nuevaSolicitud = ejecutarTransaccion((tx) => {
    const nuevoId = `SOL-${tx.contarSolicitudes() + 101}`;
    const fechaActual = new Date().toISOString();

    const solicitud: Solicitud = {
      id: nuevoId,
      creadorId: creador.id,
      titulo,
      descripcion,
      ubicacion,
      estado: "REGISTRADA",
      prioridad,
      creadaEn: fechaActual,
      cerradaEn: null,
    };

    const eventoInicial: EventoHistorial = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      solicitudId: nuevoId,
      autorId: creador.id,
      estadoPrevio: null,
      estadoNuevo: "REGISTRADA",
      nota: "Solicitud registrada por el empleado.",
      fecha: fechaActual,
    };

    tx.insertarSolicitud(solicitud);
    tx.insertarEventoHistorial(eventoInicial);

    return solicitud;
  });

  // ADR-003: El adaptador de notificaciones está desacoplado; un fallo nunca revierte la creación
  adaptadorCorreoStub.notificarCreacion(nuevaSolicitud, creador);

  return nuevaSolicitud;
}

/**
 * RF04 / RN-02 / RN-03 / RN-04 / RN-06 / RNF03 / CP07 / CP08 / CS02 / CI01:
 * Cambia el estado de una solicitud verificando rol TECNICO, transición permitida en la
 * máquina de estados, nota obligatoria al cerrar y persistencia transaccional atómica.
 */
export function transicionarEstadoSolicitud(
  input: CambiarEstadoInput,
): Solicitud {
  verificarSesionActiva(input.usuario);
  const tecnico = verificarRolPermitido(input.usuario, ["TECNICO"]);

  const solicitudActual = repositorio.obtenerSolicitudPorId(input.solicitudId);
  if (!solicitudActual) {
    throw new DominioError("Solicitud no encontrada.", "NO_ENCONTRADO", 404);
  }

  const estadoPrevio = solicitudActual.estado;

  // RN-04: No se permite modificar una solicitud CERRADA en el MVP
  if (estadoPrevio === "CERRADA") {
    throw new DominioError(
      "No se permite modificar una solicitud que ya se encuentra cerrada.",
      "TRANSICION_INVALIDA",
      422,
    );
  }

  // RN-02 y RN-03: Validar que la transición esté permitida en la máquina de estados
  const permitidos = TRANSICIONES_VALIDAS[estadoPrevio] ?? [];
  if (!permitidos.includes(input.nuevoEstado)) {
    throw new DominioError(
      `Transición no válida de ${estadoPrevio} a ${input.nuevoEstado}.`,
      "TRANSICION_INVALIDA",
      422,
    );
  }

  const notaLimpia = input.nota?.trim() ?? "";

  // RN-03 / CP08: El cierre exige nota de atención no vacía
  if (input.nuevoEstado === "CERRADA" && !notaLimpia) {
    throw new DominioError(
      "Para cerrar la solicitud es obligatorio registrar una nota técnica de atención.",
      "VALIDACION_FALLIDA",
      422,
    );
  }

  // RNF03 / CI01: Actualización de estado e inserción de evento en una única transacción atómica
  const solicitudActualizada = ejecutarTransaccion((tx) => {
    const fechaActual = new Date().toISOString();

    const actualizada: Solicitud = {
      ...solicitudActual,
      estado: input.nuevoEstado,
      cerradaEn:
        input.nuevoEstado === "CERRADA"
          ? fechaActual
          : solicitudActual.cerradaEn,
    };

    const nuevoEvento: EventoHistorial = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      solicitudId: solicitudActual.id,
      autorId: tecnico.id,
      estadoPrevio,
      estadoNuevo: input.nuevoEstado,
      nota: notaLimpia || null,
      fecha: fechaActual,
    };

    tx.actualizarSolicitud(actualizada);
    tx.insertarEventoHistorial(nuevoEvento);

    return actualizada;
  });

  adaptadorCorreoStub.notificarCambioEstado(
    solicitudActualizada,
    estadoPrevio,
    tecnico,
    notaLimpia || null,
  );

  return solicitudActualizada;
}
