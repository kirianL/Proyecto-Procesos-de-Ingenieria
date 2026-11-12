"use client";

import type { Icon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { cn } from "@/helpers/classname-helper";
import { SlotNumber } from "@/components/ui/SlotNumber";

type Tono = "neutral" | "amber" | "blue" | "emerald";

const TONOS: Record<Tono, { barra: string; spark: string }> = {
  neutral: { barra: "bg-grayscale-9", spark: "bg-grayscale-9" },
  amber: { barra: "bg-amber-500", spark: "bg-amber-500" },
  blue: { barra: "bg-blue-500", spark: "bg-blue-500" },
  emerald: { barra: "bg-emerald-600", spark: "bg-emerald-600" },
};

const TICKS = 10;
const SPARK = [11, 20, 14, 28, 17, 23];

function Spark({ tono, ratio }: { tono: Tono; ratio: number }) {
  const encendidas = Math.min(
    SPARK.length,
    Math.max(ratio > 0 ? 1 : 0, Math.round(ratio * SPARK.length)),
  );

  return (
    <span aria-hidden className="flex h-7 items-end gap-[3.5px]">
      {SPARK.map((alto, i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] rounded-full transition-colors duration-300",
            i < encendidas
              ? TONOS[tono].spark
              : "bg-grayscale-3 dark:bg-grayscale-4/60",
          )}
          style={{ height: alto }}
        />
      ))}
    </span>
  );
}

export function MetricCard({
  label,
  valor,
  detalle,
  unidad,
  dot,
  tono = "neutral",
  delay = 0,
  decimals = 0,
  total,
  icon: IconComponent,
  className,
}: {
  label: string;
  valor: number;
  detalle: string;
  unidad?: string;
  dot: string;
  tono?: Tono;
  delay?: number;
  decimals?: number;
  total?: number;
  icon?: Icon;
  className?: string;
}) {
  const ratio =
    typeof total === "number" && total > 0 ? Math.min(1, valor / total) : 1;
  const activos =
    typeof total === "number" && total > 0
      ? Math.min(
          TICKS,
          Math.max(valor > 0 ? 1 : 0, Math.round(ratio * TICKS)),
        )
      : null;

  return (
    <div
      className={cn(
        "card flex flex-col rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs transition-all duration-200 hover:border-grayscale-4 hover:shadow-xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50",
        className,
      )}
      style={{ "--stagger": delay } as CSSProperties}
    >
      {/* CUERPO SUPERIOR: isla blanca enmarcada dentro del chasis gris */}
      <div className="flex flex-1 flex-col justify-between rounded-[1rem] border border-grayscale-3/60 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2">
        {/* Fila superior: label + icono */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
            <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-grayscale-9">
              {label}
            </span>
          </div>

          {IconComponent && (
            <span
              skullet-block=""
              className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-grayscale-3/90 bg-grayscale-1 text-grayscale-10 shadow-2xs dark:border-grayscale-4/70 dark:bg-grayscale-3"
            >
              <IconComponent size={12} weight="bold" />
            </span>
          )}
        </div>

        {/* Bloque inferior del cuerpo: valor + spark + ticks */}
        <div className="mt-2.5 flex flex-col gap-2.5">
          <div className="flex items-end justify-between gap-3">
            <p className="flex min-w-0 items-baseline gap-1.5">
              <SlotNumber
                value={valor}
                decimals={decimals}
                className="text-[28px] font-bold leading-none tracking-tight text-grayscale-12 font-mono"
              />
              {unidad && (
                <span className="truncate text-[11.5px] font-medium text-grayscale-9">
                  {unidad}
                </span>
              )}
            </p>
            <Spark tono={tono} ratio={ratio} />
          </div>

          {/* Barra de progreso segmentada — siempre presente para mantener altura */}
          <div
            aria-hidden
            className="flex items-center gap-[4px]"
            title={activos !== null ? `${Math.round(ratio * 100)}%` : undefined}
          >
            {Array.from({ length: TICKS }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-[3.5px] flex-1 rounded-full transition-all duration-300",
                  activos !== null && i < activos
                    ? TONOS[tono].barra
                    : "bg-grayscale-3/60 dark:bg-grayscale-4/30",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* PIE INFERIOR: Franja gris suave — siempre al fondo */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
        <p className="truncate font-medium">{detalle}</p>
        <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
          Período
        </span>
      </div>
    </div>
  );
}
