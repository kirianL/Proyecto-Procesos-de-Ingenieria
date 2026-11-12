"use client";

import {
  ClipboardTextIcon,
  PlusIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import Button from "@/components/public/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { SolicitudCard } from "@/components/ui/SolicitudCard";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeCrearSolicitud } from "@/lib/mantenimiento/auth";
import {
  getSolicitudesPorCreador,
  getUsuarioActual,
  SOLICITUDES_MUESTRA,
} from "@/lib/mantenimiento/store";
import type { Solicitud, Usuario } from "@/lib/mantenimiento/types";

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);

  useEffect(() => {
    const refrescar = () => {
      const actual = getUsuarioActual();
      setUsuario(actual);
      setSolicitudes(getSolicitudesPorCreador(actual.id));
    };
    refrescar();
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  const autorizado = puedeCrearSolicitud(usuario);

  useAtajos(
    {
      n: () => router.push("/solicitudes/nueva"),
      escape: () => router.push("/"),
    },
    autorizado,
  );

  if (!autorizado) {
    return (
      <AccesoRestringido
        codigoPantalla="I03"
        tituloPantalla="Mis solicitudes"
        usuario={usuario}
        rolesPermitidos={["EMPLEADO"]}
        motivo="La vista personal 'Mis solicitudes' corresponde al recorrido del empleado solicitante (RF02 y Tabla 19). El personal técnico y la jefatura disponen de la Bandeja técnica (I05) y del panel de Indicadores (I08)."
        reglaReferencia="RF02 · RN-05 · Tabla 19"
      />
    );
  }

  const lista = solicitudes ?? SOLICITUDES_MUESTRA.slice(0, 3);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-5">
        <PageHeader
          codigo="I03"
          eyebrow="Empleado"
          titulo="Mis solicitudes"
          descripcion={`Todo lo que has reportado como ${nombreLimpio(usuario.nombre)}, con su estado y fecha de registro.`}
          meta={
            <span className="badge bg-grayscale-2 px-2.5 py-1 text-[12px] text-grayscale-11 inline-flex items-center gap-1.5">
              <span className="badge-dot bg-grayscale-8" />
              <SlotNumber value={lista.length} className="font-semibold text-grayscale-12" />
              <span>{lista.length === 1 ? "registrada" : "registradas"}</span>
            </span>
          }
          acciones={
            <Button href="/solicitudes/nueva" variant="primary">
              <PlusIcon size={14} weight="bold" />
              <span>Nueva solicitud</span>
            </Button>
          }
        />

        <SkeletonContent
          id="mis-solicitudes-lista"
          loading={solicitudes === null}
          label="Cargando solicitudes"
        >
          {lista.length === 0 ? (
            <EmptyState
              icon={ClipboardTextIcon}
              titulo="Todavía no hay solicitudes"
              descripcion="Cuando registres una falla de infraestructura o un requerimiento técnico, aparecerá aquí con su estado en tiempo real."
              accion={
                <Button href="/solicitudes/nueva" variant="primary">
                  <PlusIcon size={14} weight="bold" />
                  <span>Crear la primera solicitud</span>
                </Button>
              }
            />
          ) : (
            <div className="stagger space-y-3">
              {lista.map((solicitud, index) => (
                <div
                  key={solicitud.id}
                  style={{ "--stagger": index } as CSSProperties}
                >
                  <SolicitudCard
                    solicitud={solicitud}
                    icon={
                      solicitud.estado === "CERRADA"
                        ? ClipboardTextIcon
                        : WrenchIcon
                    }
                    href={`/solicitudes/${solicitud.id}`}
                  />
                </div>
              ))}
            </div>
          )}
        </SkeletonContent>
      </div>

      <BottomBar
        statusInfo={{
          title:
            solicitudes === null
              ? "Cargando solicitudes"
              : `${solicitudes.length} ${
                  solicitudes.length === 1
                    ? "solicitud registrada"
                    : "solicitudes registradas"
                }`,
          subtitle: `Sesión de ${nombreLimpio(usuario.nombre)} · ${usuario.rol.toLowerCase()}`,
        }}
        primaryLabel="Nueva solicitud"
        primaryHref="/solicitudes/nueva"
        shortcuts={[
          { key: "N", label: "Nueva solicitud" },
          { key: "Esc", label: "Volver al panel" },
        ]}
      />
    </div>
  );
}
