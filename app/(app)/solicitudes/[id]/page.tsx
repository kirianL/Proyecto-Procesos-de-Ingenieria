"use client";

import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  MapPinIcon,
  UserIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { Timeline } from "@/components/mantenimiento/Timeline";
import Button from "@/components/public/Button";
import { InfoPanel, InfoRow } from "@/components/ui/InfoPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { fechaCompleta } from "@/helpers/fecha";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeVerSolicitud } from "@/lib/mantenimiento/auth";
import {
  DETALLE_MUESTRA,
  getDetalleSolicitud,
  getUsuarioActual,
} from "@/lib/mantenimiento/store";
import type { SolicitudConDetalles, Usuario } from "@/lib/mantenimiento/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DetalleSolicitudPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [solicitud, setSolicitud] = useState<
    SolicitudConDetalles | null | undefined
  >(undefined);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());

  useEffect(() => {
    const actualizar = () => {
      setSolicitud(getDetalleSolicitud(id) ?? null);
      setUsuario(getUsuarioActual());
    };
    actualizar();
    window.addEventListener("usuario-cambiado", actualizar);
    return () => window.removeEventListener("usuario-cambiado", actualizar);
  }, [id]);

  const esTecnico = usuario.rol === "TECNICO";
  const esCerrada = solicitud?.estado === "CERRADA";
  const bandeja =
    usuario.rol === "EMPLEADO"
      ? "/mis-solicitudes"
      : usuario.rol === "JEFATURA"
        ? "/indicadores"
        : "/mantenimiento";
  const autorizado = solicitud ? puedeVerSolicitud(usuario, solicitud) : true;

  useAtajos(
    {
      escape: () => router.push(bandeja),
      ...(autorizado
        ? { h: () => router.push(`/solicitudes/${id}/historial`) }
        : {}),
      ...(autorizado && esTecnico && !esCerrada
        ? { a: () => router.push(`/mantenimiento/${id}/atencion`) }
        : {}),
    },
    solicitud !== undefined,
  );

  if (solicitud === null) {
    notFound();
  }

  if (solicitud !== undefined && !autorizado) {
    return (
      <AccesoRestringido
        codigoPantalla="I04"
        tituloPantalla="Detalle de solicitud"
        usuario={usuario}
        rolesPermitidos={["TECNICO", "JEFATURA"]}
        motivo="Por política de privacidad y aislamiento (RF02, RN-05 y CP04), un empleado únicamente puede consultar las solicitudes registradas por su propia cuenta."
        reglaReferencia="RF02 · RN-05 · RNF02 · CP04"
      />
    );
  }

  const cargando = solicitud === undefined;
  const ficha = solicitud ?? DETALLE_MUESTRA;
  const ultimoEvento = ficha.historial[ficha.historial.length - 1];

  return (
    <div className="mx-auto w-full max-w-4xl 2xl:max-w-5xl space-y-6">
      <SkeletonContent
        id={`detalle-${id}`}
        loading={cargando}
        label="Cargando ficha de la solicitud"
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            codigo="I04"
            eyebrow="Detalle"
            volver={{
              href: bandeja,
              label: esTecnico ? "Bandeja técnica" : "Mis solicitudes",
            }}
            meta={
              <>
                <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-grayscale-10 dark:bg-grayscale-2/70">
                  {ficha.id}
                </span>
                <EstadoBadge estado={ficha.estado} size="sm" />
                <PrioridadChip prioridad={ficha.prioridad} />
              </>
            }
            titulo={ficha.titulo}
            acciones={
              <>
                <Button
                  href={`/solicitudes/${ficha.id}/historial`}
                  variant="secondary"
                >
                  <ClockCounterClockwiseIcon size={14} weight="bold" />
                  <span>Historial</span>
                </Button>

                {esTecnico && !esCerrada && (
                  <Button
                    href={`/mantenimiento/${ficha.id}/atencion`}
                    variant="primary"
                  >
                    <WrenchIcon size={14} weight="bold" />
                    <span>Atender</span>
                  </Button>
                )}
              </>
            }
          />

          {/* Ficha técnica con fusión moderna dual-tone */}
          <section className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <InfoPanel>
                  <InfoRow icon={UserIcon} label="Solicitante">
                    {nombreLimpio(ficha.creador.nombre)}
                  </InfoRow>
                  <InfoRow icon={MapPinIcon} label="Ubicación">
                    <span className="line-clamp-1">{ficha.ubicacion}</span>
                  </InfoRow>
                  <InfoRow icon={CheckCircleIcon} label="Departamento">
                    {ficha.creador.departamento}
                  </InfoRow>
                </InfoPanel>

                <InfoPanel>
                  <InfoRow icon={CalendarBlankIcon} label="Registrada">
                    <TiempoRelativo fecha={ficha.creadaEn} completo />
                  </InfoRow>
                  <InfoRow
                    icon={ClockCounterClockwiseIcon}
                    label="Último movimiento"
                  >
                    {ultimoEvento ? (
                      <TiempoRelativo fecha={ultimoEvento.fecha} completo />
                    ) : (
                      "Sin eventos"
                    )}
                  </InfoRow>
                  <InfoRow icon={ClockCounterClockwiseIcon} label="Eventos">
                    <SlotNumber value={ficha.historial.length} />
                  </InfoRow>
                </InfoPanel>
              </div>

              <div className="space-y-2">
                <h2 className="section-label">Descripción del problema</h2>
                <div className="surface-soft p-4">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-grayscale-12">
                    {ficha.descripcion}
                  </p>
                </div>
              </div>

              {ficha.cerradaEn && (
                <div className="surface-soft flex items-start gap-2.5 px-4 py-3 text-[12px] text-grayscale-11 border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircleIcon
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <div>
                    <p className="font-semibold text-grayscale-12">
                      Solicitud cerrada
                    </p>
                    <p className="text-grayscale-10">
                      {fechaCompleta(ficha.cerradaEn)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Franja inferior gris con resumen de estado */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-grayscale-10">
              <span>Registrado por {ficha.creador.nombre}</span>
              <span className="font-mono text-[10.5px]">ID: {ficha.id}</span>
            </div>
          </section>

          {/* Historial preview con fusión dual-tone */}
          <section className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-grayscale-3/80 pb-3 dark:border-grayscale-3/50">
                <h2 className="text-[13px] font-semibold text-grayscale-12">
                  Línea de tiempo reciente
                </h2>
                <Link
                  href={`/solicitudes/${ficha.id}/historial`}
                  className="group inline-flex items-center gap-1 font-mono text-[11.5px] text-grayscale-10 transition-colors hover:text-grayscale-12"
                >
                  <span>Ver completa (</span>
                  <SlotNumber value={ficha.historial.length} />
                  <span>)</span>
                  <ArrowRightIcon
                    size={11}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              <Timeline eventos={ficha.historial} />
            </div>

            <div className="px-4 py-2 text-[11px] text-grayscale-9">
              Línea de auditoría inmutable
            </div>
          </section>
        </div>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: `Ficha ${id}`,
          subtitle: solicitud
            ? `${solicitud.estado} · ${solicitud.historial.length} movimientos`
            : undefined,
        }}
        primaryLabel={esTecnico && !esCerrada ? "Atender solicitud" : undefined}
        primaryHref={
          esTecnico && !esCerrada
            ? `/mantenimiento/${id}/atencion`
            : undefined
        }
        shortcuts={[
          { key: "Esc", label: "Volver a la bandeja" },
          { key: "H", label: "Ver historial" },
          ...(esTecnico && !esCerrada
            ? [{ key: "A", label: "Atender" }]
            : []),
        ]}
      />
    </div>
  );
}
