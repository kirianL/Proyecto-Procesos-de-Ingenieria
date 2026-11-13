"use client";

import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import { calcularEstadoSla } from "@/lib/mantenimiento/sla";
import type { Solicitud } from "@/lib/mantenimiento/types";

interface SolicitudCardProps {
  solicitud: Solicitud;
  /** @deprecated Mantenido por compatibilidad; el diseño actual prescinde de caja de icono */
  icon?: Icon;
  href?: string;
  acciones?: ReactNode;
  pie?: ReactNode;
  className?: string;
}

/**
 * Ficha de solicitud con fusión dual-tone nativa:
 * - Isla superior blanca con título, folio/ubicación/fecha, estado y descripción.
 * - Franja inferior gris más oscura con prioridad, telemetría SLA y acción.
 */
export function SolicitudCard({
  solicitud,
  href,
  acciones,
  pie,
  className,
}: SolicitudCardProps) {
  const sla = calcularEstadoSla(solicitud);

  const colorBarraSla =
    sla.estadoSla === "EXCEDIDO" || sla.estadoSla === "INCUMPLIDO"
      ? "bg-red-8"
      : sla.estadoSla === "POR_VENCER"
        ? "bg-amber-8"
        : "bg-green-8";

  const textoSlaClass =
    sla.estadoSla === "EXCEDIDO" || sla.estadoSla === "INCUMPLIDO"
      ? "text-red-10 dark:text-red-9"
      : sla.estadoSla === "POR_VENCER"
        ? "text-amber-10 dark:text-amber-9"
        : "text-grayscale-11";

  const contenido = (
    <article
      className={cn(
        "card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs hover:border-grayscale-5 hover:shadow-xs dark:border-white/[0.32] dark:bg-[#191917] dark:hover:border-white/[0.42]",
        href && "card-hover cursor-pointer",
        className,
      )}
    >
      {/* ISLA SUPERIOR BLANCA: título, metadatos directos, estado y descripción */}
      <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              skullet-block=""
              className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-grayscale-12"
            >
              {solicitud.titulo}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-grayscale-9">
              <span className="font-medium text-grayscale-10">
                # {solicitud.id}
              </span>
              <span aria-hidden className="text-grayscale-5 dark:text-white/20">
                |
              </span>
              <span className="inline-flex min-w-0 items-center gap-1 font-sans text-[11.5px] text-grayscale-9">
                <MapPinIcon size={12} className="shrink-0 text-grayscale-8" />
                <span className="truncate">{solicitud.ubicacion}</span>
              </span>
              <span aria-hidden className="text-grayscale-5 dark:text-white/20">
                |
              </span>
              <TiempoRelativo fecha={solicitud.creadaEn} />
            </div>
          </div>

          <EstadoBadge estado={solicitud.estado} size="sm" />
        </div>

        <p className="mt-2.5 line-clamp-2 max-h-24 text-[12.5px] leading-relaxed text-grayscale-10">
          {solicitud.descripcion}
        </p>
      </div>

      {/* FRANJA INFERIOR GRIS: prioridad, barras SLA, contexto y acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-grayscale-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <PrioridadChip prioridad={solicitud.prioridad} />
          <span aria-hidden className="text-grayscale-5 dark:text-white/20">
            |
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex flex-col-reverse gap-[1.5px]" aria-hidden>
              {Array.from({ length: 4 }).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-[2px] w-2.5 rounded-[1px]",
                    idx < sla.segmentosActivos
                      ? colorBarraSla
                      : "bg-grayscale-4 dark:bg-white/[0.12]",
                  )}
                />
              ))}
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-semibold tabular-nums",
                textoSlaClass,
              )}
            >
              {sla.etiquetaCorta}
            </span>
            <span className="hidden text-[10.5px] text-grayscale-9 sm:inline">
              | {sla.objetivoHoras}h
            </span>
          </span>
          {pie ? (
            <>
              <span aria-hidden className="text-grayscale-5 dark:text-white/20">
                |
              </span>
              <span className="text-grayscale-9">{pie}</span>
            </>
          ) : null}
        </div>

        <div>
          {acciones ??
            (href && (
              <span className="flex shrink-0 items-center gap-1 font-mono text-[11.5px] font-medium text-grayscale-10 transition-colors duration-150 group-hover:text-grayscale-12">
                Ver ficha
                <ArrowRightIcon
                  size={11}
                  className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
                />
              </span>
            ))}
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} prefetch className="group block">
        {contenido}
      </Link>
    );
  }

  return contenido;
}
