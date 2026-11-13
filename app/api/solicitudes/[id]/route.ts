import { type NextRequest, NextResponse } from "next/server";
import { consultarDetalleSolicitudAutorizado } from "@/lib/mantenimiento/consultas";
import {
  manejarErrorApi,
  resolverUsuarioSesionServidor,
} from "@/lib/mantenimiento/http-auth";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/solicitudes/:id
 * Propósito: Consultar detalle de una solicitud (RF02, RF05, CP04, CS03).
 * Reglas server-side (Tabla 36): Comprueba propietario (si es EMPLEADO) o permiso técnico/jefatura.
 * Rechaza accesos ajenos con 403 sin exponer detalles.
 */
export async function GET(request: NextRequest, context: Context) {
  try {
    const usuario = resolverUsuarioSesionServidor(request);
    const { id } = await context.params;
    const detalle = consultarDetalleSolicitudAutorizado(usuario, id);

    return NextResponse.json({ ok: true, data: detalle });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

