"use client";

import { useEffect, useRef } from "react";
import { type SlotOptions, type SlotTextController, slotText } from "slot-text";
import { cn } from "@/helpers/classname-helper";

/**
 * Etiqueta con roll animado (slot-text). El texto se renderiza también en
 * el servidor para que no haya parpadeo; la animación solo corre cuando el
 * valor cambia después del montaje.
 */
export function SlotText({
  text,
  options,
  className,
}: {
  text: string;
  options?: SlotOptions;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const control = useRef<SlotTextController | null>(null);
  const primeraVez = useRef(true);
  const opciones = useRef(options);
  opciones.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || el.closest("[skullet-ghost], [skullet-loading]")) return;

    control.current = slotText(el, text, {
      rollBy: "character",
      duration: 240,
      stagger: 16,
      bounce: 0.25,
      ...opciones.current,
    });

    return () => {
      control.current?.destroy();
      control.current = null;
      primeraVez.current = true;
    };
    // Solo al montar: el texto inicial ya viene en el HTML.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!control.current) return;

    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }

    control.current.set(text, opciones.current);
  }, [text]);

  return (
    <span ref={ref} aria-label={text} className={cn("inline-flex", className)}>
      {text}
    </span>
  );
}
