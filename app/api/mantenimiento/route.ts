import { type NextRequest, NextResponse } from "next/server";
import { consultarBandejaMantenimiento } from "@/lib/mantenimiento/consultas";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";
import { ESTADOS, type Estado } from "@/lib/mantenimiento/types";

/**
 * GET /api/mantenimiento
 * Propósito: Consultar bandeja técnica global con filtro de estado y orden temporal (RF03, CP05, CP06).
 * Reglas server-side (Tabla 36): Requiere perfil autorizado (TECNICO / lectura JEFATURA); rechaza EMPLEADO.
 */
export async function GET(request: NextRequest) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const estadoParam = request.nextUrl.searchParams.get("estado");
    const filtro: Estado | "TODAS" =
      estadoParam && ESTADOS.includes(estadoParam as Estado)
        ? (estadoParam as Estado)
        : "TODAS";

    const bandeja = consultarBandejaMantenimiento(usuario, filtro);

    return NextResponse.json({ ok: true, data: bandeja });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
