"use client";

import type { Icon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { cn } from "@/helpers/classname-helper";

type Tono = "neutral" | "amber" | "blue" | "emerald";

const TONOS: Record<Tono, { barra: string; spark: string }> = {
  neutral: { barra: "bg-grayscale-9", spark: "bg-grayscale-9" },
  amber: { barra: "bg-amber-500", spark: "bg-amber-500" },
  blue: { barra: "bg-blue-500", spark: "bg-blue-500" },
  emerald: { barra: "bg-emerald-600", spark: "bg-emerald-600" },
};

const TICKS_IDS = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9"] as const;
const SPARK_BARS = [
  { id: "s0", alto: 11 },
  { id: "s1", alto: 20 },
  { id: "s2", alto: 14 },
  { id: "s3", alto: 28 },
  { id: "s4", alto: 17 },
  { id: "s5", alto: 23 },
] as const;

function Spark({ tono, ratio }: { tono: Tono; ratio: number }) {
  const encendidas = Math.min(
    SPARK_BARS.length,
    Math.max(ratio > 0 ? 1 : 0, Math.round(ratio * SPARK_BARS.length)),
  );

  return (
    <div
      aria-hidden
      skullet-block=""
      className="flex h-7 shrink-0 items-end gap-[3.5px]"
    >
      {SPARK_BARS.map((barra, i) => (
        <div
          key={barra.id}
          className={cn(
            "w-[2px] rounded-full transition-colors duration-200",
            i < encendidas
              ? TONOS[tono].spark
              : "bg-grayscale-3 dark:bg-grayscale-4/60",
          )}
          style={{ height: barra.alto }}
        />
      ))}
    </div>
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
          TICKS_IDS.length,
          Math.max(valor > 0 ? 1 : 0, Math.round(ratio * TICKS_IDS.length)),
        )
      : null;

  return (
    <div
      className={cn(
        "card-shell card-shell-hover flex min-w-0 flex-col",
        className,
      )}
      style={{ "--stagger": delay } as CSSProperties}
    >
      {/* CUERPO SUPERIOR: panel elevado sin márgenes laterales */}
      <div className="card-panel flex min-w-0 flex-1 flex-col justify-between px-4 py-3.5">
        {/* Fila superior: label + icono */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <div
              aria-hidden
              skullet-ignore=""
              className={cn("size-1.5 shrink-0 rounded-full", dot)}
            />
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
        <div className="mt-2.5 flex min-w-0 flex-col gap-2.5">
          <div className="flex min-w-0 items-end justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-1.5 h-7">
              <SlotNumber
                value={valor}
                decimals={decimals}
                className="text-[28px] font-bold leading-none tracking-tight text-grayscale-12 font-mono"
              />
              {unidad && (
                <span className="truncate text-[11.5px] font-medium text-grayscale-9 self-end mb-0.5">
                  {unidad}
                </span>
              )}
            </div>
            <Spark tono={tono} ratio={ratio} />
          </div>

          {/* Barra de progreso segmentada — medida como bloque único en Skullet sin estiramiento */}
          <div
            aria-hidden
            skullet-block=""
            className="flex w-full min-w-0 items-center gap-[4px]"
            title={activos !== null ? `${Math.round(ratio * 100)}%` : undefined}
          >
            {TICKS_IDS.map((tickId, i) => (
              <div
                key={tickId}
                className={cn(
                  "h-[3.5px] min-w-0 flex-1 rounded-full transition-colors duration-200",
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
      <div className="flex min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
        <p className="truncate font-medium">{detalle}</p>
        <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
          Período
        </span>
      </div>
    </div>
  );
}
