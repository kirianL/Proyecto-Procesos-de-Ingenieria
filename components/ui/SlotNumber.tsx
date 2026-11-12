"use client";

import { useEffect, useRef } from "react";
import { type SlotTextController, slotText } from "slot-text";
import { cn } from "@/helpers/classname-helper";

interface SlotNumberProps {
  value: number | string;
  className?: string;
  duration?: number;
  stagger?: number;
  bounce?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  animateOnMount?: boolean;
}

/**
 * Componente de número con animación slot-motion (slot-text).
 * - Si se encuentra dentro de `[skullet-ghost]` / `[skullet-loading]`, mantiene
 *   el texto plano para que Skullet mida el hueso con precisión milimétrica.
 * - Al revelarse el panel real, dispara el giro mecánico de los dígitos.
 */
export function SlotNumber({
  value,
  className,
  duration = 380,
  stagger = 20,
  bounce = 0.22,
  decimals = 0,
  prefix = "",
  suffix = "",
  animateOnMount = true,
}: SlotNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const control = useRef<SlotTextController | null>(null);
  const isMountedRef = useRef(false);

  const formattedBase =
    typeof value === "number"
      ? decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString("es-MX")
      : String(value);

  const fullText = `${prefix}${formattedBase}${suffix}`;
  const latestTextRef = useRef(fullText);
  latestTextRef.current = fullText;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Dentro del ghost invisible de Skullet no dividimos los nodos: así Skullet
    // mide el número completo como un único hueso limpio sin coste adicional.
    if (el.closest("[skullet-ghost], [skullet-loading]")) {
      return;
    }

    if (!animateOnMount) {
      control.current = slotText(el, fullText, {
        rollBy: "character",
        duration,
        stagger,
        bounce,
        skipUnchanged: false,
      });
      isMountedRef.current = true;
      return () => {
        control.current?.destroy();
        control.current = null;
        isMountedRef.current = false;
      };
    }

    const placeholder =
      typeof value === "number"
        ? `${prefix}${"0".repeat(Math.max(1, formattedBase.length))}${suffix}`
        : `${prefix}${"-".repeat(Math.max(1, formattedBase.length))}${suffix}`;

    control.current = slotText(el, placeholder, {
      rollBy: "character",
      duration,
      stagger,
      bounce,
      skipUnchanged: false,
    });

    const timer = setTimeout(() => {
      control.current?.set(latestTextRef.current, {
        duration,
        stagger,
        bounce,
        skipUnchanged: false,
      });
      isMountedRef.current = true;
    }, 35);

    return () => {
      clearTimeout(timer);
      control.current?.destroy();
      control.current = null;
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current || !control.current) return;
    control.current.set(fullText, {
      duration,
      stagger,
      bounce,
      skipUnchanged: false,
    });
  }, [fullText, duration, stagger, bounce]);

  return (
    <span
      ref={ref}
      aria-label={fullText}
      className={cn(
        "num font-mono inline-flex tabular-nums select-none",
        className,
      )}
    >
      {fullText}
    </span>
  );
}
