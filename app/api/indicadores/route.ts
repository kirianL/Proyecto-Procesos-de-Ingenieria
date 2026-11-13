import { type NextRequest, NextResponse } from "next/server";
import { consultarIndicadoresAutorizado } from "@/lib/mantenimiento/consultas";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";

/**
 * GET /api/indicadores
 * Propósito: Resumen agregado de operación e indicadores (RF05, RN-07, CP10).
 * Reglas server-side (Tabla 36): Exclusivo para el rol JEFATURA (solo lectura).
 */
export async function GET(request: NextRequest) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const resumen = consultarIndicadoresAutorizado(usuario);

    return NextResponse.json({ ok: true, data: resumen });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

