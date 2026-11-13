"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsOutSimpleIcon,
  DownloadSimpleIcon,
  ImageIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/helpers/classname-helper";
import type { AdjuntoEvidencia } from "@/lib/mantenimiento/types";
import { GridReveal } from "./grid-reveal";

interface EvidenceGalleryProps {
  adjuntos?: AdjuntoEvidencia[];
  recientesIds?: Set<string>;
  titulo?: string;
  compacto?: boolean;
  className?: string;
}

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function EvidenceGallery({
  adjuntos,
  recientesIds,
  titulo,
  compacto = false,
  className,
}: EvidenceGalleryProps) {
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  const lista = adjuntos ?? [];
  const activo = indiceActivo !== null ? lista[indiceActivo] : null;

  const cerrar = useCallback(() => setIndiceActivo(null), []);
  const anterior = useCallback(() => {
    setIndiceActivo((prev) =>
      prev === null ? null : (prev - 1 + lista.length) % lista.length,
    );
  }, [lista.length]);
  const siguiente = useCallback(() => {
    setIndiceActivo((prev) =>
      prev === null ? null : (prev + 1) % lista.length,
    );
  }, [lista.length]);

  useEffect(() => {
    if (indiceActivo === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrar();
      if (event.key === "ArrowLeft" && lista.length > 1) anterior();
      if (event.key === "ArrowRight" && lista.length > 1) siguiente();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [indiceActivo, lista.length, cerrar, anterior, siguiente]);

  if (lista.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {titulo && (
        <div className="flex items-center justify-between gap-2">
          <span className="section-label flex items-center gap-1.5">
            <ImageIcon size={12} className="text-grayscale-8" />
            {titulo}
          </span>
          <span className="font-mono text-[10.5px] text-grayscale-8">
            {lista.length} {lista.length === 1 ? "archivo" : "archivos"}
          </span>
        </div>
      )}

      <div
        className={cn(
          "grid gap-2.5",
          compacto
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        )}
      >
        {lista.map((item, idx) => {
          const esReciente = recientesIds ? recientesIds.has(item.id) : false;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndiceActivo(idx)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-grayscale-3/85 bg-grayscale-1/60 text-left transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-grayscale-6 hover:bg-grayscale-2/70 active:scale-[0.985] dark:border-grayscale-4/45 dark:bg-grayscale-3/30 dark:hover:border-grayscale-6/70"
            >
              <div
                className={cn(
                  "relative w-full overflow-hidden bg-grayscale-2 dark:bg-grayscale-3",
                  compacto ? "aspect-[16/10]" : "aspect-[4/3]",
                )}
              >
                <GridReveal
                  src={item.url}
                  alt={item.nombre}
                  aspect={compacto ? 1.6 : 4 / 3}
                  stagedReveal={esReciente}
                  estimatedDuration={esReciente ? 1100 : 650}
                  className="h-full w-full rounded-none"
                />

                <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-lg border border-white/20 bg-black/55 text-white opacity-0 backdrop-blur-xs transition-opacity duration-150 group-hover:opacity-100">
                  <ArrowsOutSimpleIcon size={12} weight="bold" />
                </span>

                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-white backdrop-blur-xs">
                  {item.etapa === "ATENCION" ? "Técnica" : "Reporte"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <span className="truncate text-[11px] font-medium text-grayscale-11">
                  {item.nombre}
                </span>
                <span className="shrink-0 font-mono text-[9.5px] text-grayscale-8">
                  {formatearTamano(item.tamanoBytes)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal en portal para evitar recortes de contenedores padre */}
      {activo &&
        indiceActivo !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada: ${activo.nombre}`}
            onClick={cerrar}
            className="lightbox-enter fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col justify-between gap-3 overscroll-contain bg-black/88 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:gap-4 sm:p-6"
          >
            {/* Barra superior */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-3 rounded-xl border border-white/12 bg-zinc-950/80 px-3.5 py-2.5 text-white"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-zinc-100">
                  {activo.nombre}
                </p>
                <p className="truncate font-mono text-[10.5px] text-zinc-400">
                  {activo.etapa === "ATENCION"
                    ? "Evidencia técnica"
                    : "Evidencia inicial"}{" "}
                  | {formatearTamano(activo.tamanoBytes)} | {indiceActivo + 1} /{" "}
                  {lista.length}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={activo.url}
                  download={activo.nombre}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-2.5 text-[11.5px] font-medium text-zinc-100 transition-colors hover:bg-white/15"
                >
                  <DownloadSimpleIcon size={14} weight="bold" />
                  <span className="hidden sm:inline">Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar vista ampliada"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/8 text-zinc-100 transition-colors hover:bg-white/15"
                >
                  <XIcon size={15} weight="bold" />
                </button>
              </div>
            </div>

            {/* Imagen central responsive */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden"
            >
              {lista.length > 1 && (
                <button
                  type="button"
                  onClick={anterior}
                  aria-label="Imagen anterior"
                  className="absolute left-2 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-xs transition-colors hover:bg-black/85 sm:left-4"
                >
                  <ArrowLeftIcon size={16} weight="bold" />
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activo.url}
                alt={activo.nombre}
                className="max-h-full max-w-full rounded-xl border border-white/12 bg-zinc-950 object-contain shadow-2xl"
              />

              {lista.length > 1 && (
                <button
                  type="button"
                  onClick={siguiente}
                  aria-label="Siguiente imagen"
                  className="absolute right-2 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-xs transition-colors hover:bg-black/85 sm:right-4"
                >
                  <ArrowRightIcon size={16} weight="bold" />
                </button>
              )}
            </div>

            {/* Miniaturas inferiores cuando hay más de una */}
            {lista.length > 1 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mx-auto flex max-w-full shrink-0 items-center gap-2 overflow-x-auto rounded-xl border border-white/12 bg-zinc-950/80 p-2"
              >
                {lista.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndiceActivo(idx)}
                    className={cn(
                      "relative h-11 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-[border-color,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
                      idx === indiceActivo
                        ? "border-white ring-1 ring-white/60"
                        : "border-white/15 opacity-55 hover:opacity-90",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.nombre}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div aria-hidden className="h-1 shrink-0" />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

