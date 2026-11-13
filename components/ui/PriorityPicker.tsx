"use client";

import { SlotText } from "@/components/ui/SlotText";
import { cn } from "@/helpers/classname-helper";

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export const OPCIONES_PRIORIDAD: {
  id: Prioridad;
  label: string;
  hint: string;
  /** Número de barras encendidas en el glifo escalonado. */
  nivel: number;
  /** Punto de color para barras y listas de resumen. */
  dot: string;
  /** Superficie y borde neutros cuando la tarjeta está activa (sin efecto neón). */
  pastilla: string;
  /** Color de acento semántico en glifos. */
  acento: string;
  /** Color de relleno de las mini-barras y segmentos. */
  barra: string;
}[] = [
  {
    id: "BAJA",
    label: "Baja",
    hint: "Preventivo. No afecta la operación.",
    nivel: 1,
    dot: "bg-grayscale-7",
    pastilla:
      "border-grayscale-4/90 bg-grayscale-1/75 dark:border-grayscale-4/70 dark:bg-grayscale-3/45",
    acento: "text-grayscale-11",
    barra: "bg-stone-500/80",
  },
  {
    id: "MEDIA",
    label: "Media",
    hint: "Falla menor, conviene atenderla pronto.",
    nivel: 2,
    dot: "bg-amber-8",
    pastilla:
      "border-grayscale-4/90 bg-grayscale-1/75 dark:border-grayscale-4/70 dark:bg-grayscale-3/45",
    acento: "text-amber-600 dark:text-amber-400",
    barra: "bg-amber-500/85",
  },
  {
    id: "ALTA",
    label: "Alta",
    hint: "Afecta el trabajo diario o a varias personas.",
    nivel: 3,
    dot: "bg-orange-8",
    pastilla:
      "border-grayscale-4/90 bg-grayscale-1/75 dark:border-grayscale-4/70 dark:bg-grayscale-3/45",
    acento: "text-orange-600 dark:text-orange-400",
    barra: "bg-orange-500/85",
  },
  {
    id: "URGENTE",
    label: "Urgente",
    hint: "Riesgo para la seguridad o la operación.",
    nivel: 4,
    dot: "bg-red-8",
    pastilla:
      "border-grayscale-4/90 bg-grayscale-1/75 dark:border-grayscale-4/70 dark:bg-grayscale-3/45",
    acento: "text-red-600 dark:text-red-400",
    barra: "bg-red-500/85",
  },
];

const TOTAL_SEGMENTOS = 12;

/**
 * Glifo de nivel: barras que crecen con la urgencia. El color lo hereda del
 * contenedor para que la escala se lea por proporción y altura.
 */
function Barras({
  nivel,
  className,
}: {
  nivel: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      skullet-block=""
      className={cn("flex items-end gap-[1.5px]", className)}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-[2px] rounded-full transition-colors duration-200",
            i <= nivel ? "bg-current" : "bg-current/25",
          )}
          style={{ height: `${4 + i * 2.5}px` }}
        />
      ))}
    </div>
  );
}

/**
 * Selector de prioridad con tarjetas táctiles independientes y llenado
 * progresivo uniforme por segmentos, alineado a la paleta neutra cálida.
 */
export function PriorityPicker({
  value,
  onChange,
  className,
}: {
  value: Prioridad;
  onChange: (prioridad: Prioridad) => void;
  className?: string;
}) {
  const seleccionada =
    OPCIONES_PRIORIDAD.find((opcion) => opcion.id === value) ??
    OPCIONES_PRIORIDAD[1];
  const segmentosActivos = seleccionada.nivel * 3;

  const mover = (direccion: 1 | -1) => {
    const idx = OPCIONES_PRIORIDAD.findIndex((o) => o.id === value);
    const siguiente =
      (idx + direccion + OPCIONES_PRIORIDAD.length) % OPCIONES_PRIORIDAD.length;
    onChange(OPCIONES_PRIORIDAD[siguiente].id);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="radiogroup"
        aria-label="Prioridad estimada"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            mover(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            mover(-1);
          }
        }}
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {OPCIONES_PRIORIDAD.map((opcion) => {
          const activo = opcion.id === value;
          const miniBarras = opcion.nivel * 2;

          return (
            <button
              key={opcion.id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onChange(opcion.id)}
              className={cn(
                "group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out active:scale-[0.985]",
                activo
                  ? cn(opcion.pastilla, "shadow-[0_1px_2px_rgba(28,22,16,0.06)]")
                  : "border-grayscale-3/85 bg-white hover:border-grayscale-4 hover:bg-grayscale-1/70 dark:border-grayscale-4/50 dark:bg-grayscale-2 dark:hover:bg-grayscale-3/45",
              )}
            >
              <div>
                {/* Fila 1: Nivel | Estado */}
                <div className="flex items-center justify-between gap-1 font-mono text-[10px] text-grayscale-9">
                  <span>NIVEL 0{opcion.nivel}</span>
                  <span
                    className={cn(
                      "transition-colors duration-150",
                      activo
                        ? "font-semibold text-grayscale-12"
                        : "text-grayscale-7",
                    )}
                  >
                    {activo ? "Activa" : "Elegir"}
                  </span>
                </div>

                {/* Fila 2: Título + glifo en recuadro */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[13.5px] font-semibold tracking-[-0.01em] transition-colors duration-150",
                      activo ? "text-grayscale-12" : "text-grayscale-11",
                    )}
                  >
                    {opcion.label}
                  </span>

                  <span
                    skullet-block=""
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border border-grayscale-3/90 bg-grayscale-1 transition-colors duration-200 dark:border-grayscale-4/60 dark:bg-grayscale-3",
                      activo
                        ? opcion.acento
                        : "text-grayscale-8 group-hover:text-grayscale-11",
                    )}
                  >
                    <Barras nivel={opcion.nivel} />
                  </span>
                </div>

                {/* Fila 3: Descripción integrada */}
                <p className="mt-1.5 text-[11px] leading-snug text-grayscale-9">
                  {opcion.hint}
                </p>
              </div>

              {/* Fila 4: Pie con 8 mini-barras progresivas */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-grayscale-3/60 pt-2 dark:border-grayscale-4/30">
                <div
                  aria-hidden
                  skullet-block=""
                  className="flex items-center gap-[2px]"
                >
                  {Array.from({ length: 8 }).map((_, t) => (
                    <div
                      key={t}
                      className={cn(
                        "h-2 w-[2.5px] rounded-full transition-colors duration-200 ease-out",
                        t < miniBarras
                          ? activo
                            ? opcion.barra
                            : "bg-grayscale-6/70"
                          : "bg-grayscale-3 dark:bg-grayscale-4/50",
                      )}
                    />
                  ))}
                </div>

                <span className="font-mono text-[9.5px] text-grayscale-8">
                  {opcion.nivel}/4
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra inferior de llenado acumulativo uniforme en 12 segmentos */}
      <div className="rounded-xl border border-grayscale-3/75 bg-grayscale-1/60 px-3 py-2.5 dark:border-grayscale-4/40 dark:bg-grayscale-3/30">
        <div
          aria-hidden
          skullet-block=""
          className="grid grid-cols-12 gap-1"
        >
          {Array.from({ length: TOTAL_SEGMENTOS }).map((_, idx) => {
            const encendido = idx < segmentosActivos;

            return (
              <div
                key={idx}
                className={cn(
                  "h-1.5 w-full rounded-[2px] transition-colors duration-200 ease-out",
                  encendido
                    ? seleccionada.barra
                    : "bg-grayscale-3/80 dark:bg-grayscale-4/35",
                )}
              />
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-grayscale-9">
          <span aria-live="polite" className="min-w-0 truncate">
            <SlotText
              text={seleccionada.hint}
              options={{ duration: 220, stagger: 10, bounce: 0.18 }}
            />
          </span>
          <span className="shrink-0 font-mono text-[10.5px] font-semibold text-grayscale-12">
            Nivel {seleccionada.nivel}/4 · {seleccionada.label}
          </span>
        </div>
      </div>
    </div>
  );
}
