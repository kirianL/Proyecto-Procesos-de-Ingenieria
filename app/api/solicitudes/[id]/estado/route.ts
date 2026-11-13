import { type NextRequest, NextResponse } from "next/server";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";
import { transicionarEstadoSolicitud } from "@/lib/mantenimiento/solicitudes";
import type { AdjuntoEvidencia, Estado } from "@/lib/mantenimiento/types";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/solicitudes/:id/estado
 * Propósito: Cambiar estado o cerrar solicitud (RF04, CP07, CP08, CS02, CI01).
 * Reglas server-side (Tabla 36): Requiere rol TECNICO, transición válida,
 * nota obligatoria al cerrar y transacción atómica con evento de historial.
 */
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const actualizada = transicionarEstadoSolicitud({
      usuario,
      solicitudId: id,
      nuevoEstado: body.nuevoEstado as Estado,
      nota: typeof body.nota === "string" ? body.nota : "",
      adjuntos: Array.isArray(body.adjuntos)
        ? (body.adjuntos as AdjuntoEvidencia[])
        : undefined,
    });

    return NextResponse.json({ ok: true, data: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

