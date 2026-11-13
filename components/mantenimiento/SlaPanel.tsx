"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { cn } from "@/helpers/classname-helper";
import { calcularEstadoSla, type EstadoSla } from "@/lib/mantenimiento/sla";
import type { Solicitud } from "@/lib/mantenimiento/types";

const COLOR_SEGMENTOS: Record<EstadoSla, string> = {
  EN_MARGEN: "bg-emerald-600/80",
  CUMPLIDO: "bg-emerald-600/80",
  POR_VENCER: "bg-amber-500/85",
  EXCEDIDO: "bg-red-500/85",
  INCUMPLIDO: "bg-red-500/85",
};

const COLOR_TEXTO: Record<EstadoSla, string> = {
  EN_MARGEN: "text-emerald-700 dark:text-emerald-400",
  CUMPLIDO: "text-emerald-700 dark:text-emerald-400",
  POR_VENCER: "text-amber-700 dark:text-amber-400",
  EXCEDIDO: "text-red-600 dark:text-red-400",
  INCUMPLIDO: "text-red-600 dark:text-red-400",
};

export function SlaBadge({
  solicitud,
  className,
}: {
  solicitud: Pick<
    Solicitud,
    "prioridad" | "estado" | "creadaEn" | "cerradaEn"
  >;
  className?: string;
}) {
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    if (solicitud.estado === "CERRADA") return;
    const id = window.setInterval(() => setAhoraMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [solicitud.estado]);

  const sla = calcularEstadoSla(solicitud, ahoraMs);
  const Icon =
    sla.estadoSla === "CUMPLIDO"
      ? CheckCircleIcon
      : sla.estadoSla === "EXCEDIDO" || sla.estadoSla === "INCUMPLIDO"
        ? WarningCircleIcon
        : ClockIcon;

  return (
    <span
      title={sla.etiquetaDetalle}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10.5px] font-medium",
        COLOR_TEXTO[sla.estadoSla],
        className,
      )}
    >
      <Icon size={12} weight="bold" className="shrink-0" />
      <span>{sla.etiquetaCorta}</span>
    </span>
  );
}

export function SlaPanel({
  solicitud,
  className,
}: {
  solicitud: Pick<
    Solicitud,
    "prioridad" | "estado" | "creadaEn" | "cerradaEn"
  >;
  className?: string;
}) {
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    if (solicitud.estado === "CERRADA") return;
    const id = window.setInterval(() => setAhoraMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [solicitud.estado]);

  const sla = calcularEstadoSla(solicitud, ahoraMs);

  return (
    <div
      className={cn(
        "rounded-xl border border-grayscale-3/75 bg-grayscale-1/60 p-3.5 dark:border-white/[0.1] dark:bg-[#171715]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-grayscale-12">
            Nivel de servicio (SLA)
          </span>
          <span className="text-grayscale-5">|</span>
          <span className="font-mono text-[11px] text-grayscale-9">
            Meta: {sla.objetivoHoras}h
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={cn("font-semibold", COLOR_TEXTO[sla.estadoSla])}>
            {sla.etiquetaEstado}
          </span>
          <span className="text-grayscale-5">|</span>
          <span className="text-grayscale-10">{sla.etiquetaCorta}</span>
        </div>
      </div>

      {/* Pista de 12 segmentos uniforme */}
      <div
        skullet-block=""
        className="mt-2.5 grid grid-cols-12 gap-1.5"
        aria-hidden
      >
        {Array.from({ length: 12 }).map((_, idx) => {
          const activo = idx < sla.segmentosActivos;
          return (
            <div
              key={idx}
              className={cn(
                "h-2 w-full rounded-[3px] transition-colors duration-200 ease-out",
                activo
                  ? COLOR_SEGMENTOS[sla.estadoSla]
                  : "bg-grayscale-3/75 dark:bg-grayscale-4/40",
              )}
            />
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-grayscale-9">
        <span>{sla.etiquetaDetalle}</span>
        <span className="font-mono text-[10.5px]">
          {sla.porcentajeConsumido}% consumido
        </span>
      </div>
    </div>
  );
}

