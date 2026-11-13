"use client";

import {
  CalendarBlankIcon,
  ClockCounterClockwiseIcon,
  FlagCheckeredIcon,
} from "@phosphor-icons/react/dist/ssr";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { Timeline } from "@/components/mantenimiento/Timeline";
import Button from "@/components/public/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
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

export default function HistorialSolicitudPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [solicitud, setSolicitud] = useState<
    SolicitudConDetalles | null | undefined
  >(() => getDetalleSolicitud(id) ?? undefined);
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

  const autorizado = solicitud ? puedeVerSolicitud(usuario, solicitud) : true;

  useAtajos(
    { escape: () => router.push(`/solicitudes/${id}`) },
    solicitud !== undefined && autorizado,
  );

  if (solicitud === null) {
    notFound();
  }

  if (solicitud !== undefined && !autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Historial de cambios"
        usuario={usuario}
        rolesPermitidos={["TECNICO", "JEFATURA"]}
        motivo="El registro de actividad de esta solicitud solo está disponible para la persona que la reportó y para el equipo de mantenimiento."
      />
    );
  }

  const cargando = solicitud === undefined;
  const ficha = solicitud ?? DETALLE_MUESTRA;
  const primero = ficha.historial[0];
  const ultimo = ficha.historial[ficha.historial.length - 1];

  return (
    <div className="mx-auto w-full max-w-4xl 2xl:max-w-5xl flex flex-1 flex-col justify-between gap-6">
      <SkeletonContent
        id={`historial-${id}`}
        loading={cargando}
        label="Cargando historial"
      >
        <div className="flex flex-col gap-5">
          <PageHeader
            codigo="I07"
            eyebrow="Trazabilidad"
            volver={{
              href: `/solicitudes/${ficha.id}`,
              label: "Ficha técnica",
            }}
            meta={
              <>
                <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-grayscale-10 dark:bg-grayscale-2/70">
                  {ficha.id}
                </span>
                <span className="text-[11px] text-grayscale-9 inline-flex items-center gap-1">
                  <SlotNumber
                    value={ficha.historial.length}
                    className="font-semibold text-grayscale-11"
                  />
                  <span>eventos registrados</span>
                </span>
              </>
            }
            titulo="Historial de cambios"
            acciones={
              <Button href={`/solicitudes/${ficha.id}`} variant="secondary">
                Volver a la ficha
              </Button>
            }
          />

          <div className="grid gap-3.5 sm:grid-cols-3">
            {/* Apertura */}
            <div className="card flex min-w-0 flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
              <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[1rem] border border-grayscale-3/60 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-grayscale-8"
                    />
                    <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-grayscale-9">
                      Apertura
                    </span>
                  </div>
                  <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-grayscale-3/90 bg-grayscale-1 text-grayscale-10 shadow-2xs dark:border-grayscale-4/70 dark:bg-grayscale-3">
                    <CalendarBlankIcon size={12} weight="bold" />
                  </span>
                </div>

                <div className="mt-3 text-[16px] font-bold tracking-tight text-grayscale-12">
                  {primero ? <TiempoRelativo fecha={primero.fecha} completo /> : "—"}
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                <span className="truncate font-medium">
                  {primero ? primero.autor.nombre : "Sin registro"}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
                  Inicio
                </span>
              </div>
            </div>

            {/* Último cambio */}
            <div className="card flex min-w-0 flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
              <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[1rem] border border-grayscale-3/60 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-blue-500"
                    />
                    <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-grayscale-9">
                      Último cambio
                    </span>
                  </div>
                  <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-grayscale-3/90 bg-grayscale-1 text-grayscale-10 shadow-2xs dark:border-grayscale-4/70 dark:bg-grayscale-3">
                    <ClockCounterClockwiseIcon size={12} weight="bold" />
                  </span>
                </div>

                <div className="mt-3 text-[16px] font-bold tracking-tight text-grayscale-12">
                  {ultimo ? <TiempoRelativo fecha={ultimo.fecha} completo /> : "—"}
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                <span className="truncate font-medium">
                  {ultimo ? ultimo.autor.nombre : "Sin movimientos"}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
                  <SlotNumber value={ficha.historial.length} className="font-semibold" />{" "}
                  eventos
                </span>
              </div>
            </div>

            {/* Estado actual */}
            <div className="card flex min-w-0 flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
              <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[1rem] border border-grayscale-3/60 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className={
                        ficha.estado === "CERRADA"
                          ? "size-1.5 shrink-0 rounded-full bg-emerald-600"
                          : ficha.estado === "EN_PROCESO"
                            ? "size-1.5 shrink-0 rounded-full bg-amber-500"
                            : "size-1.5 shrink-0 rounded-full bg-grayscale-9"
                      }
                    />
                    <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-grayscale-9">
                      Estado actual
                    </span>
                  </div>
                  <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-grayscale-3/90 bg-grayscale-1 text-grayscale-10 shadow-2xs dark:border-grayscale-4/70 dark:bg-grayscale-3">
                    <FlagCheckeredIcon size={12} weight="bold" />
                  </span>
                </div>

                <div className="mt-2.5 flex flex-col gap-2">
                  <div>
                    <EstadoBadge estado={ficha.estado} size="sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-1" aria-hidden>
                    {(["REGISTRADA", "EN_PROCESO", "CERRADA"] as const).map(
                      (etapa, idx) => {
                        const pasoActual =
                          ficha.estado === "CERRADA"
                            ? 2
                            : ficha.estado === "EN_PROCESO"
                              ? 1
                              : 0;
                        const activo = idx <= pasoActual;
                        return (
                          <span
                            key={etapa}
                            className={
                              activo
                                ? ficha.estado === "CERRADA"
                                  ? "h-[3.5px] rounded-full bg-emerald-600"
                                  : "h-[3.5px] rounded-full bg-amber-500"
                                : "h-[3.5px] rounded-full bg-grayscale-3/60 dark:bg-grayscale-4/30"
                            }
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                <span className="truncate font-medium">Ciclo de atención</span>
                <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
                  {ficha.estado === "CERRADA"
                    ? "3/3 completado"
                    : ficha.estado === "EN_PROCESO"
                      ? "2/3 en atención"
                      : "1/3 registrada"}
                </span>
              </div>
            </div>
          </div>

          <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-grayscale-12">
                    Línea de tiempo
                  </h2>
                  <span className="text-[11px] text-grayscale-9">
                    Orden ascendente | autor y fecha por evento
                  </span>
                </div>

                <Timeline eventos={ficha.historial} />
              </div>
            </div>

            <div className="px-4 py-2 text-[11px] text-grayscale-9">
              Cada evento queda vinculado al usuario firmante y a una fecha atómica.
            </div>
          </section>
        </div>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: `${ficha.historial.length} eventos en ${ficha.id}`,
          subtitle:
            "Cada evento queda vinculado al usuario firmante y a una fecha atómica.",
        }}
        primaryLabel="Volver a la ficha"
        primaryHref={`/solicitudes/${ficha.id}`}
        shortcuts={[{ key: "Esc", label: "Volver a la ficha" }]}
      />
    </div>
  );
}
