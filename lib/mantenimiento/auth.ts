import { DominioError, type Rol, type Solicitud, type Usuario } from "./types";

export const COOKIE_SESION = "mantenimiento_usuario_id";

/**
 * RNF02 / CS01: Verifica que exista una sesión autenticada válida.
 * Si no hay sesión activa, rechaza con código 401 sin modificar ni exponer datos.
 */
export function verificarSesionActiva(
  usuario: Usuario | null | undefined,
): asserts usuario is Usuario {
  if (!usuario) {
    throw new DominioError(
      "Autenticación requerida. Inicie sesión con un perfil válido.",
      "NO_AUTENTICADO",
      401,
    );
  }
}

/**
 * RNF02 / Tabla 13: Verifica que el usuario autenticado posea uno de los roles autorizados.
 */
export function verificarRolPermitido(
  usuario: Usuario | null | undefined,
  rolesPermitidos: readonly Rol[],
): Usuario {
  verificarSesionActiva(usuario);

  if (!rolesPermitidos.includes(usuario.rol)) {
    throw new DominioError(
      `Operación no autorizada para el perfil ${usuario.rol}.`,
      "NO_AUTORIZADO",
      403,
    );
  }

  return usuario;
}

/**
 * RF02 / RN-05 / CP04 / CS03: Verifica si un usuario tiene derecho a consultar una solicitud.
 * Un EMPLEADO únicamente puede consultar solicitudes creadas por él mismo.
 * TECNICO y JEFATURA poseen acceso de lectura según Tabla 13.
 */
export function verificarAccesoSolicitud(
  usuario: Usuario | null | undefined,
  solicitud: Solicitud,
): void {
  verificarSesionActiva(usuario);

  if (usuario.rol === "EMPLEADO" && solicitud.creadorId !== usuario.id) {
    throw new DominioError(
      "No tiene autorización para consultar ni acceder a solicitudes de otros usuarios.",
      "NO_AUTORIZADO",
      403,
    );
  }
}

export function puedeVerSolicitud(
  usuario: Usuario | null | undefined,
  solicitud: Solicitud | null | undefined,
): boolean {
  if (!usuario || !solicitud) return false;
  if (usuario.rol === "EMPLEADO") {
    return solicitud.creadorId === usuario.id;
  }
  return usuario.rol === "TECNICO" || usuario.rol === "JEFATURA";
}

export function puedeGestionarAtencion(
  usuario: Usuario | null | undefined,
): boolean {
  return Boolean(usuario && usuario.rol === "TECNICO");
}

export function puedeVerBandejaTecnica(
  usuario: Usuario | null | undefined,
): boolean {
  return Boolean(
    usuario && (usuario.rol === "TECNICO" || usuario.rol === "JEFATURA"),
  );
}

export function puedeVerIndicadores(
  usuario: Usuario | null | undefined,
): boolean {
  return Boolean(usuario && usuario.rol === "JEFATURA");
}

export function puedeCrearSolicitud(
  usuario: Usuario | null | undefined,
): boolean {
  return Boolean(usuario && usuario.rol === "EMPLEADO");
}

