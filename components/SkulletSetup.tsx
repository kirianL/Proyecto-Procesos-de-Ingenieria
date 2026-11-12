"use client";

import type { ReactNode } from "react";
import { type RevealContext, type RevealSpec, sweep } from "skullet";
import { SkulletProvider } from "skullet/react";

/**
 * Configuración global de Skullet:
 * - `SWEEP_REVEAL`: aplica el barrido diagonal (`sweep`) con brillo especular
 *   al ritmo y ángulo del shimmer (`110deg`), sin retardo (`hold: 0`).
 * - `speed: "fast"` y `animation: "shimmer"` mantienen todos los huesos de la
 *   página sincronizados en una única onda continua.
 */
const SWEEP_REVEAL: RevealSpec = {
  hold: 0,
  choose: (ctx: RevealContext) =>
    sweep.choose
      ? sweep.choose({
          ...ctx,
          waited: Math.max(ctx.waited, 320),
          input: false,
          refetch: false,
        })
      : sweep,
};

export function SkulletSetup({ children }: { children: ReactNode }) {
  return (
    <SkulletProvider
      reveal={SWEEP_REVEAL}
      theme={{
        animation: "shimmer",
        speed: "fast",
        radius: "0.375rem",
      }}
    >
      {children}
    </SkulletProvider>
  );
}
