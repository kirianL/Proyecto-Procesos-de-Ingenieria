"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima un número desde 0 hasta el valor final.
 * Se desactiva con `prefers-reduced-motion`.
 */
export function useCountUp(target: number, options?: { duration?: number; decimals?: number }) {
  const { duration = 720, decimals = 0 } = options ?? {};
  const [value, setValue] = useState(0);
  const previo = useRef(target);

  useEffect(() => {
    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducido || previo.current === target) {
      setValue(target);
      previo.current = target;
      return;
    }

    let frame = 0;
    const inicio = performance.now();
    const desde = 0;

    const tick = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / duration);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      const actual = desde + (target - desde) * suavizado;
      const factor = Math.pow(10, decimals);
      setValue(Math.round(actual * factor) / factor);

      if (progreso < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previo.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, decimals]);

  return value;
}
