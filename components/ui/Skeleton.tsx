"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { SkeletonBox, Skeleton as SkulletSkeleton } from "skullet/react";
import { cn } from "@/helpers/classname-helper";

/**
 * Barra individual de Skullet para casos puntuales donde no hay contenido real.
 * Comparte el mismo flujo de shimmer sincronizado de toda la página.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("overflow-hidden", className)}>
      <SkeletonBox width="100%" height="100%" radius="inherit" />
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`linea-${i}`}
          className={cn(
            "h-3",
            i === lines - 1 ? "w-3/5" : i === 0 ? "w-full" : "w-11/12",
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return null;
}

export function SkeletonKpis(_props: { count?: number }) {
  return null;
}

export function SkeletonListItem() {
  return null;
}

export function SkeletonList(_props: { rows?: number }) {
  return null;
}

export function SkeletonPanel(_props: { lines?: number }) {
  return null;
}

/**
 * Contenedor inteligente de Skullet:
 * - Renderiza siempre `children` dentro del motor de medición (`[skullet-ghost]`)
 *   sin sobrescribirlo con placeholders manuales, conservando las superficies
 *   reales (tarjetas dual-tone, bordes, cabeceras) y trazando huesos exactos
 *   para cada línea de texto, número, chip, botón e icono.
 * - Mantiene una ventana táctil (`minLoadMs`) al montar o cambiar de perfil/vista
 *   para que el shimmer sincronizado y el barrido diagonal (`sweep`) se aprecien
 *   con suavidad nativa y 0px de salto de layout.
 */
export function SkeletonContent({
  loading = false,
  id,
  label = "Cargando contenido",
  minLoadMs = 340,
  className,
  style,
  children,
}: {
  loading?: boolean;
  id?: string;
  skeleton?: ReactNode;
  label?: string;
  minLoadMs?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setHidratado(false);
    const timer = window.setTimeout(() => {
      setHidratado(true);
    }, minLoadMs);

    return () => window.clearTimeout(timer);
    // Solo se ejecuta al montar la vista inicialmente (no al cambiar filtros locales).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const alCambiarUsuario = () => {
      setHidratado(false);
      window.setTimeout(() => {
        setHidratado(true);
      }, 280);
    };

    window.addEventListener("usuario-cambiado", alCambiarUsuario);
    return () =>
      window.removeEventListener("usuario-cambiado", alCambiarUsuario);
  }, []);

  const mostrarEsqueleto = loading || !hidratado;

  return (
    <SkulletSkeleton
      id={id}
      loading={mostrarEsqueleto}
      label={label}
      className={className}
      style={style}
    >
      {children}
    </SkulletSkeleton>
  );
}

/** Envoltura accesible para estados de carga. */
export function Cargando({
  children,
  label = "Cargando contenido",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
