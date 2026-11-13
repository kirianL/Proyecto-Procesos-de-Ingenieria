import { type NextRequest, NextResponse } from "next/server";
import { consultarMisSolicitudes } from "@/lib/mantenimiento/consultas";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";

/**
 * GET /api/solicitudes/mias
 * Propósito: Listar solicitudes propias (RF02, CP03).
 * Reglas server-side (Tabla 36): Filtra creador exclusivamente por sesión del servidor.
 */
export async function GET(request: NextRequest) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const solicitudes = consultarMisSolicitudes(usuario);

    return NextResponse.json({ ok: true, data: solicitudes });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

