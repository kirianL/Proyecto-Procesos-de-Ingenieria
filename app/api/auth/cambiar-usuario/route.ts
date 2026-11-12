import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/mantenimiento/auth";
import { repositorio } from "@/lib/mantenimiento/persistencia";
import { setUsuarioActual } from "@/lib/mantenimiento/store";

/**
 * POST /api/auth/cambiar-usuario
 * Gestiona la sesión verificable en servidor para los perfiles ficticios del prototipo (I01).
 * Si las credenciales no son válidas, devuelve 401 sin revelar usuarios existentes (Tabla 20).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.cerrarSesion === true) {
      const response = NextResponse.json({ ok: true, usuario: null });
      response.cookies.delete(COOKIE_SESION);
      return response;
    }

    const { usuarioId } = body;
    if (!usuarioId || typeof usuarioId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Sesión inválida o credenciales incompletas." },
        { status: 401 },
      );
    }

    const encontrado = repositorio.obtenerUsuarioPorId(usuarioId);
    if (!encontrado) {
      // Tabla 20 (I01): Sesión inválida sin revelar usuarios existentes
      return NextResponse.json(
        { ok: false, error: "Credenciales o perfil de acceso no válidos." },
        { status: 401 },
      );
    }

    const usuario = setUsuarioActual(encontrado.id);
    const response = NextResponse.json({ ok: true, usuario });

    response.cookies.set(COOKIE_SESION, usuario.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error procesando la sesión de usuario." },
      { status: 500 },
    );
  }
}
