import { type NextRequest, NextResponse } from "next/server";
import { consultarHistorialAutorizado } from "@/lib/mantenimiento/consultas";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/solicitudes/:id/historial
 * Propósito: Consultar eventos cronológicos de historial (RF05, CP09, CS03).
 * Reglas server-side (Tabla 36): Permisos idénticos al detalle.
 */
export async function GET(request: NextRequest, context: Context) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const { id } = await context.params;
    const historial = consultarHistorialAutorizado(usuario, id);

    return NextResponse.json({ ok: true, data: historial });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
