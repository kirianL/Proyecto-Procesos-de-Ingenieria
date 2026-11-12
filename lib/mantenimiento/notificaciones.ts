import type { Estado, Solicitud, Usuario } from "./types";

export interface NotificacionCorreo {
  id: string;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  solicitudId: string;
  estadoDestino: Estado;
  enviadaEn: string;
  estadoEnvio: "DESHABILITADO_MVP" | "SIMULADO_OK" | "FALLO_PROVEEDOR";
}

export interface AdaptadorNotificaciones {
  notificarCreacion(solicitud: Solicitud, creador: Usuario): void;
  notificarCambioEstado(
    solicitud: Solicitud,
    estadoPrevio: Estado,
    autor: Usuario,
    nota: string | null,
  ): void;
}

const bandejaSalidaSimulada: NotificacionCorreo[] = [];
let simularFalloProveedor = false;

/**
 * Permite en pruebas unitarias simular una caída del proveedor externo de correo
 * para comprobar el criterio de diseño para fallos (Sección 4.9 y ADR-003):
 * "Si el servicio futuro de correo no responde, el guardado de la solicitud no puede fallar."
 */
export function configurarFalloProveedorCorreo(fallar: boolean): void {
  simularFalloProveedor = fallar;
}

export function obtenerNotificacionesEmitidas(): ReadonlyArray<NotificacionCorreo> {
  return bandejaSalidaSimulada;
}

export function limpiarNotificacionesEmitidas(): void {
  bandejaSalidaSimulada.length = 0;
}

/**
 * ADR-003: Adaptador de notificaciones por correo electrónico desacoplado e inactivo en el MVP.
 * Registra los eventos de notificación en un buzón de auditoría sin requerir infraestructura SMTP externa.
 */
export const adaptadorCorreoStub: AdaptadorNotificaciones = {
  notificarCreacion(solicitud, creador) {
    try {
      if (simularFalloProveedor) {
        throw new Error("Proveedor SMTP externo no disponible");
      }
      bandejaSalidaSimulada.push({
        id: `MAIL-${Date.now()}-${bandejaSalidaSimulada.length + 1}`,
        destinatario: creador.correo,
        asunto: `[Mantenimiento] Solicitud ${solicitud.id} registrada`,
        cuerpo: `Su reporte "${solicitud.titulo}" en ${solicitud.ubicacion} ha sido registrado con estado ${solicitud.estado}.`,
        solicitudId: solicitud.id,
        estadoDestino: solicitud.estado,
        enviadaEn: new Date().toISOString(),
        estadoEnvio: "DESHABILITADO_MVP",
      });
    } catch {
      bandejaSalidaSimulada.push({
        id: `MAIL-ERR-${Date.now()}`,
        destinatario: creador.correo,
        asunto: `[Fallo diferido] Solicitud ${solicitud.id}`,
        cuerpo:
          "No se pudo contactar al proveedor de correo; operación principal preservada.",
        solicitudId: solicitud.id,
        estadoDestino: solicitud.estado,
        enviadaEn: new Date().toISOString(),
        estadoEnvio: "FALLO_PROVEEDOR",
      });
    }
  },

  notificarCambioEstado(solicitud, estadoPrevio, autor, nota) {
    try {
      if (simularFalloProveedor) {
        throw new Error("Proveedor SMTP externo no disponible");
      }
      bandejaSalidaSimulada.push({
        id: `MAIL-${Date.now()}-${bandejaSalidaSimulada.length + 1}`,
        destinatario: "notificaciones@ejemplo.test",
        asunto: `[Mantenimiento] ${solicitud.id}: ${estadoPrevio} -> ${solicitud.estado}`,
        cuerpo: `Actualizado por ${autor.nombre} (${autor.rol}). Nota: ${nota ?? "Sin nota adicional"}`,
        solicitudId: solicitud.id,
        estadoDestino: solicitud.estado,
        enviadaEn: new Date().toISOString(),
        estadoEnvio: "DESHABILITADO_MVP",
      });
    } catch {
      bandejaSalidaSimulada.push({
        id: `MAIL-ERR-${Date.now()}`,
        destinatario: "notificaciones@ejemplo.test",
        asunto: `[Fallo diferido] ${solicitud.id}`,
        cuerpo:
          "No se pudo contactar al proveedor de correo; transición preservada.",
        solicitudId: solicitud.id,
        estadoDestino: solicitud.estado,
        enviadaEn: new Date().toISOString(),
        estadoEnvio: "FALLO_PROVEEDOR",
      });
    }
  },
};
