"use client";

import type { Icon } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/helpers/classname-helper";
import { SlotNumber } from "@/components/ui/SlotNumber";

export interface Segmento<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: Icon;
}

interface SegmentedControlProps<T extends string> {
  items: Segmento<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Control segmentado con indicador deslizante sobre una pista suave.
 * El indicador se mide del DOM para que funcione también cuando los items
 * cambian de ancho o se envuelven en pantallas pequeñas.
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const contenedor = useRef<HTMLDivElement>(null);
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

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
  }, [value, items.length]);

  const hayActivo = items.some((item) => item.id === value);

  const mover = (direccion: 1 | -1) => {
    const indice = items.findIndex((item) => item.id === value);
    const base = indice === -1 ? (direccion === 1 ? -1 : 0) : indice;
    const siguiente = (base + direccion + items.length) % items.length;
    onChange(items[siguiente].id);
    const boton = botones.current.get(items[siguiente].id);
    boton?.focus();
  };

  return (
    <div
      ref={contenedor}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "no-scrollbar relative flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain touch-pan-x rounded-xl bg-grayscale-2 p-1 sm:inline-flex dark:border dark:border-white/[0.09] dark:bg-[#161614]",
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          mover(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          mover(-1);
        }
      }}
    >
      {pill && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-lg border border-black/[0.04] bg-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.08)] transition-[left,top,width,height,opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] dark:border-white/[0.12] dark:bg-[#252522] dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
            hayActivo ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
          style={{
            left: pill.left,
            top: pill.top,
            width: pill.width,
            height: pill.height,
          }}
        />
      )}

      {items.map((item) => {
        const activo = item.id === value;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) botones.current.set(item.id, el);
              else botones.current.delete(item.id);
            }}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] sm:px-3 sm:text-[13px]",
              activo
                ? "text-grayscale-12"
                : "text-grayscale-10 hover:text-grayscale-12",
            )}
          >
            {Icon && (
              <Icon
                size={14}
                weight={activo ? "fill" : "regular"}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  activo ? "text-grayscale-11" : "text-grayscale-9",
                )}
              />
            )}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <SlotNumber
                value={item.count}
                duration={260}
                className={cn(
                  "text-[11px] font-medium transition-colors duration-150",
                  activo ? "text-grayscale-10" : "text-grayscale-9",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
