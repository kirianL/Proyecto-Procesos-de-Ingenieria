"use client";

import type { ReactNode } from "react";
import type { RevealSpec } from "skullet";
import { SkulletProvider } from "skullet/react";

/**
 * Configuración global de Skullet optimizada para escritorio y móviles:
 * - Revelado `together` acelerado por GPU (opacidad en compositor, 150ms, hold: 0)
 *   evitando el repintado frame-a-frame de `mask-image` que penaliza GPUs móviles.
 * - `speed: "fast"` y `animation: "shimmer"` mantienen todos los huesos de la
 *   página sincronizados en una única onda continua y fluida.
 */
const NATIVE_FAST_REVEAL: RevealSpec = {
  hold: 0,
  choose: () => ({
    kind: "together",
    delay: 0,
    duration: 150,
  }),
};

export function SkulletSetup({ children }: { children: ReactNode }) {
  return (
    <SkulletProvider
      reveal={NATIVE_FAST_REVEAL}
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
