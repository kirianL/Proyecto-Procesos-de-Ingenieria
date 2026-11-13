"use client";

import {
  CameraIcon,
  ImageIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRef, useState } from "react";
import { cn } from "@/helpers/classname-helper";
import type { AdjuntoEvidencia } from "@/lib/mantenimiento/types";
import { EvidenceGallery } from "./EvidenceGallery";

interface EvidenceUploaderProps {
  value: AdjuntoEvidencia[];
  onChange: (next: AdjuntoEvidencia[]) => void;
  etapa: "REPORTE" | "ATENCION";
  maxArchivos?: number;
  className?: string;
}

function leerArchivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

async function comprimirImagen(
  file: File,
): Promise<{ url: string; bytes: number }> {
  const dataUrl = await leerArchivoComoDataUrl(file);
  if (file.type === "image/svg+xml" || typeof window === "undefined") {
    return { url: dataUrl, bytes: file.size };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1280;
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ url: dataUrl, bytes: file.size });
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const comprimida = canvas.toDataURL("image/jpeg", 0.82);
      const estimadoBytes = Math.round((comprimida.length * 3) / 4);
      resolve({
        url: comprimida,
        bytes: Math.min(file.size, estimadoBytes),
      });
    };
    img.onerror = () => resolve({ url: dataUrl, bytes: file.size });
    img.src = dataUrl;
  });
}

export function EvidenceUploader({
  value,
  onChange,
  etapa,
  maxArchivos = 4,
  className,
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [recientesIds, setRecientesIds] = useState<Set<string>>(
    () => new Set(),
  );

  const procesarArchivos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAviso(null);

    const disponibles = Math.max(0, maxArchivos - value.length);
    if (disponibles === 0) {
      setAviso(`Límite de ${maxArchivos} imágenes alcanzado.`);
      return;
    }

    const validos = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, disponibles);

    if (validos.length === 0) {
      setAviso("Solo se admiten archivos de imagen (JPG, PNG, WebP).");
      return;
    }

    setProcesando(true);
    try {
      const nuevos: AdjuntoEvidencia[] = [];
      for (const file of validos) {
        const { url, bytes } = await comprimirImagen(file);
        nuevos.push({
          id: `ADJ-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          nombre: file.name || `evidencia-${nuevos.length + 1}.jpg`,
          url,
          tipo: file.type || "image/jpeg",
          tamanoBytes: bytes,
          etapa,
          creadoEn: new Date().toISOString(),
        });
      }
      setRecientesIds((prev) => {
        const next = new Set(prev);
        for (const item of nuevos) next.add(item.id);
        return next;
      });
      onChange([...value, ...nuevos]);
    } catch {
      setAviso("No se pudo procesar alguna de las imágenes seleccionadas.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
    setAviso(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          void procesarArchivos(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border border-dashed p-3.5 transition-colors duration-150",
          arrastrando
            ? "border-grayscale-8 bg-grayscale-2/90 dark:bg-grayscale-3/60"
            : "border-grayscale-4/85 bg-grayscale-1/55 hover:border-grayscale-5 dark:border-grayscale-4/45 dark:bg-grayscale-3/25",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-grayscale-3/85 bg-white text-grayscale-10 dark:border-white/[0.12] dark:bg-[#161614]">
              <ImageIcon size={15} weight="duotone" />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-grayscale-12">
                {procesando
                  ? "Optimizando imagen…"
                  : "Arrastra fotos aquí o selecciona desde tu dispositivo"}
              </p>
              <p className="font-mono text-[10.5px] text-grayscale-9">
                Opcional | Máx. {maxArchivos} imágenes ({value.length}/
                {maxArchivos})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={procesando || value.length >= maxArchivos}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-grayscale-4/80 bg-white px-2.5 text-[12px] font-medium text-grayscale-11 transition-colors hover:border-grayscale-5 hover:text-grayscale-12 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#161614]"
            >
              <UploadSimpleIcon size={13} weight="bold" />
              <span>Subir foto</span>
            </button>

            <button
              type="button"
              disabled={procesando || value.length >= maxArchivos}
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-grayscale-4/80 bg-white px-2.5 text-[12px] font-medium text-grayscale-11 transition-colors hover:border-grayscale-5 hover:text-grayscale-12 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#161614]"
            >
              <CameraIcon size={13} weight="bold" />
              <span>Cámara</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void procesarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void procesarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {aviso && (
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
          {aviso}
        </p>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {value.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-grayscale-3 bg-grayscale-1 px-2 py-1 text-[11px] text-grayscale-11 dark:border-grayscale-4/45 dark:bg-grayscale-3/40"
              >
                <span className="max-w-[140px] truncate">{item.nombre}</span>
                <button
                  type="button"
                  onClick={() => eliminar(item.id)}
                  aria-label={`Quitar ${item.nombre}`}
                  className="cursor-pointer rounded p-0.5 text-grayscale-8 transition-colors hover:bg-grayscale-3 hover:text-grayscale-12"
                >
                  <XIcon size={11} weight="bold" />
                </button>
              </span>
            ))}
          </div>

          <EvidenceGallery
            adjuntos={value}
            recientesIds={recientesIds}
            compacto
          />
        </div>
      )}
    </div>
  );
}
