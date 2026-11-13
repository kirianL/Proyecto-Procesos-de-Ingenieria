"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  /** Tinte de la pastilla deslizante. */
  pastilla: string;
  /** Color del glifo y del texto cuando la opción está activa. */
  acento: string;
}[] = [
  {
    id: "BAJA",
    label: "Baja",
    hint: "Preventivo. No afecta la operación.",
    nivel: 1,
    dot: "bg-grayscale-7",
    pastilla: "border-grayscale-4/70 bg-grayscale-1",
    acento: "text-grayscale-11",
  },
  {
    id: "MEDIA",
    label: "Media",
    hint: "Falla menor, conviene atenderla pronto.",
    nivel: 2,
    dot: "bg-amber-8",
    pastilla: "border-amber-5/70 bg-amber-2",
    acento: "text-amber-11",
  },
  {
    id: "ALTA",
    label: "Alta",
    hint: "Afecta el trabajo diario o a varias personas.",
    nivel: 3,
    dot: "bg-orange-8",
    pastilla: "border-orange-5/70 bg-orange-2",
    acento: "text-orange-11",
  },
  {
    id: "URGENTE",
    label: "Urgente",
    hint: "Riesgo para la seguridad o la operación.",
    nivel: 4,
    dot: "bg-red-8",
    pastilla: "border-red-5/70 bg-red-2",
    acento: "text-red-11",
  },
];

/**
 * Glifo de nivel: barras que crecen con la urgencia. El color lo hereda del
 * segmento para que la escala se lea sin relying en el color por sí solo.
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
 * Selector de prioridad.
 *
 * Escala horizontal de cuatro peldaños con indicador deslizante: el nivel se
 * elige de un vistazo y la descripción del peldaño activo aparece debajo,
 * sin ocupar el alto de cuatro tarjetas con radio y checkbox propio.
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
  const contenedor = useRef<HTMLDivElement>(null);
  const botones = useRef(new Map<string, HTMLElement>());
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const seleccionada =
    OPCIONES_PRIORIDAD.find((opcion) => opcion.id === value) ??
    OPCIONES_PRIORIDAD[1];

  useLayoutEffect(() => {
    const medir = () => {
      const el = botones.current.get(value);
      if (!el) return;
      setPill({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    medir();

    const observador = new ResizeObserver(medir);
    if (contenedor.current) observador.observe(contenedor.current);

    return () => observador.disconnect();
  }, [value]);

  return (
    <div className={cn("space-y-2.5", className)}>
      {/*
        El grupo de radios nativos cubre la navegación con flechas, Home y
        End sin JavaScript adicional: la semántica y el teclado los resuelve
        el navegador.
      */}
      <div
        ref={contenedor}
        role="radiogroup"
        aria-label="Prioridad estimada"
        className="relative grid grid-cols-2 gap-1 rounded-xl border border-grayscale-3/70 bg-grayscale-2/60 p-1 sm:grid-cols-4 dark:border-grayscale-3/50 dark:bg-grayscale-2/40"
      >
        {pill && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute rounded-lg border shadow-[0_1px_2px_rgba(28,22,16,0.08)] transition-[left,top,width,height,background-color,border-color] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              seleccionada.pastilla,
            )}
            style={{
              left: pill.left,
              top: pill.top,
              width: pill.width,
              height: pill.height,
            }}
          />
        )}

        {OPCIONES_PRIORIDAD.map((opcion) => {
          const activo = opcion.id === value;

          return (
            <label
              key={opcion.id}
              ref={(el) => {
                if (el) botones.current.set(opcion.id, el);
                else botones.current.delete(opcion.id);
              }}
              className={cn(
                "relative z-10 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 sm:px-1 sm:py-2 transition-colors duration-150 focus-within:ring-2 focus-within:ring-grayscale-6 focus-within:ring-offset-1 focus-within:ring-offset-transparent",
                activo
                  ? cn("font-semibold", opcion.acento)
                  : "font-medium text-grayscale-9 hover:text-grayscale-11",
              )}
            >
              <input
                type="radio"
                name="prioridad"
                value={opcion.id}
                checked={activo}
                onChange={() => onChange(opcion.id)}
                className="sr-only"
              />
              <Barras nivel={opcion.nivel} />
              <span className="text-[12px] leading-none">
                {opcion.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Descripción del peldaño activo */}
      <p
        aria-live="polite"
        className="flex items-start gap-2 text-[11.5px] leading-snug text-grayscale-9">
        <span
          aria-hidden
          className={cn("mt-[3px] size-1.5 shrink-0 rounded-full", seleccionada.dot)}
        />
        <span>
          <SlotText
            text={seleccionada.hint}
            options={{ duration: 240, stagger: 10, bounce: 0.2 }}
          />
        </span>
      </p>
    </div>
  );
}
