import { type NextRequest, NextResponse } from "next/server";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";
import { registrarSolicitud } from "@/lib/mantenimiento/solicitudes";
import type { Prioridad } from "@/lib/mantenimiento/types";

/**
 * POST /api/solicitudes
 * Propósito: Crear solicitud (RF01).
 * Reglas server-side (Tabla 36): Requiere sesión activa, rol EMPLEADO y datos válidos.
 * Obtiene creador_id exclusivamente de la sesión del servidor (Sección 8.5).
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const body = await request.json().catch(() => ({}));

    const nueva = registrarSolicitud({
      usuario,
      titulo: typeof body.titulo === "string" ? body.titulo : "",
      descripcion: typeof body.descripcion === "string" ? body.descripcion : "",
      ubicacion: typeof body.ubicacion === "string" ? body.ubicacion : "",
      prioridad: body.prioridad as Prioridad | undefined,
    });

    return NextResponse.json({ ok: true, data: nueva }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
