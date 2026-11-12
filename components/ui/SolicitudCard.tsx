import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  FlagIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import type { Estado, Solicitud } from "@/lib/mantenimiento/types";

const TILE: Record<Estado, string> = {
  REGISTRADA: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  EN_PROCESO: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  CERRADA: "text-grayscale-10 bg-grayscale-2 border-grayscale-3/80",
};

interface SolicitudCardProps {
  solicitud: Solicitud;
  icon: Icon;
  href?: string;
  acciones?: ReactNode;
  pie?: ReactNode;
  className?: string;
}

/**
 * Ficha de solicitud con fusión moderna dual-tone:
 * - Parte superior blanca con título, estado y descripción.
 * - Franja inferior gris con metadatos (ubicación, prioridad, fecha) y acción.
 */
export function SolicitudCard({
  solicitud,
  icon: IconComponent,
  href,
  acciones,
  pie,
  className,
}: SolicitudCardProps) {
  const contenido = (
    <article
      className={cn(
        "card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs transition-all duration-200 hover:border-grayscale-4 hover:shadow-xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50",
        href && "card-hover cursor-pointer",
        className,
      )}
    >
      {/* CUERPO SUPERIOR: isla blanca enmarcada dentro del chasis gris */}
      <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2">
        <div className="flex items-start gap-3">
          <span
            skullet-block=""
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
              TILE[solicitud.estado],
            )}
          >
            <IconComponent size={18} weight="duotone" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-grayscale-12">
                  {solicitud.titulo}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-grayscale-9">
                  <span>{solicitud.id}</span>
                  <span aria-hidden className="text-grayscale-6">
                    ·
                  </span>
                  <TiempoRelativo fecha={solicitud.creadaEn} />
                </p>
              </div>

              <EstadoBadge estado={solicitud.estado} size="sm" />
            </div>

            <p className="mt-2 line-clamp-2 max-h-24 text-[12.5px] leading-relaxed text-grayscale-10">
              {solicitud.descripcion}
            </p>
          </div>
        </div>
      </div>

      {/* PIE INFERIOR: Franja gris suave con metadatos y llamada a la acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-grayscale-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-grayscale-11 font-medium">
            <MapPinIcon size={13} className="text-grayscale-8 shrink-0" />
            <span className="line-clamp-1">{solicitud.ubicacion}</span>
          </span>
          <span className="text-grayscale-5 dark:text-grayscale-5/50">•</span>
          <PrioridadChip prioridad={solicitud.prioridad} />
          {pie && (
            <>
              <span className="text-grayscale-5 dark:text-grayscale-5/50">•</span>
              <span className="text-grayscale-9">{pie}</span>
            </>
          )}
        </div>

        <div>
          {acciones ??
            (href && (
              <span className="flex shrink-0 items-center gap-1 font-mono text-[11.5px] font-medium text-grayscale-10 transition-colors duration-150 group-hover:text-grayscale-12">
                Ver ficha
                <ArrowRightIcon
                  size={11}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
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
