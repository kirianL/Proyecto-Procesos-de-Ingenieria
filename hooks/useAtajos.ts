"use client";

import { useEffect, useRef } from "react";

/**
 * Atajos de teclado reales. Las teclas se declaran como "n", "1",
 * "escape" o combinaciones con modificadores: "ctrl+enter".
 */
export function useAtajos(
  atajos: Record<string, (event: KeyboardEvent) => void>,
  enabled = true,
) {
  const ref = useRef(atajos);
  ref.current = atajos;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const objetivo = event.target as HTMLElement | null;
      const escribiendo =
        !!objetivo &&
        (objetivo.isContentEditable ||
          /^(input|textarea|select)$/i.test(objetivo.tagName));

      const partes: string[] = [];
      if (event.ctrlKey || event.metaKey) partes.push("ctrl");
      if (event.altKey) partes.push("alt");
      if (event.shiftKey) partes.push("shift");

      const tecla = event.key.toLowerCase();
      const combo = [...partes, tecla].join("+");
      const accion = ref.current[combo];

      if (!accion) return;

      const conModificador = partes.length > 0;
      if (escribiendo && !conModificador && tecla !== "escape") return;

      event.preventDefault();
      accion(event);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
