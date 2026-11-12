import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION } from "./auth";
import { repositorio } from "./persistencia";
import { DominioError, type Usuario } from "./types";

/**
 * Resuelve la identidad del usuario autenticado exclusivamente a partir de la sesión
 * en el servidor (cookie HttpOnly/lax `mantenimiento_usuario_id` o cabecera de sesión en pruebas).
 * Nunca confía en un `creadorId` enviado dentro del cuerpo de la petición (Sección 8.4).
 */
export function resolverUsuarioSesionServidor(
  request: NextRequest,
): Usuario | null {
  const cookieVal = request.cookies.get(COOKIE_SESION)?.value;
  const headerVal = request.headers.get("x-usuario-sesion");
  const usuarioId = cookieVal ?? headerVal ?? null;

  if (!usuarioId || usuarioId === "anonimo") {
    return null;
  }

  return repositorio.obtenerUsuarioPorId(usuarioId) ?? null;
}

/**
 * Convierte errores del dominio en respuestas HTTP estandarizadas (400/401/403/404/422/500)
 * sin exponer trazas internas ni datos restringidos (RNF02 y Sección 4.9).
 */
export function manejarErrorApi(error: unknown): NextResponse {
  if (error instanceof DominioError) {
    return NextResponse.json(
      {
        ok: false,
        codigo: error.codigo,
        error: error.message,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      codigo: "ERROR_INTERNO",
      error: "No se pudo procesar la solicitud en el servidor.",
    },
    { status: 500 },
  );
}
