import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

interface PageHeaderProps {
  /** Código de pantalla del documento de requerimientos (I01–I08). */
  codigo?: string;
  /** Texto secundario junto al código. */
  eyebrow?: string;
  /** Enlace de retorno contextual. */
  volver?: { href: string; label: string };
  titulo: string;
  descripcion?: string;
  /** Chips o metadatos que acompañan al título. */
  meta?: ReactNode;
  /** Botones de acción alineados a la derecha. */
  acciones?: ReactNode;
  className?: string;
}

export function PageHeader({
  codigo,
  eyebrow,
  volver,
  titulo,
  descripcion,
  meta,
  acciones,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-grayscale-9">
          {volver && (
            <Link
              href={volver.href}
              className="group inline-flex items-center gap-1 text-grayscale-10 transition-colors duration-150 hover:text-grayscale-12"
            >
              <ArrowLeftIcon
                size={11}
                weight="bold"
                className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
              />
              <span>{volver.label}</span>
            </Link>
          )}

          {volver && (codigo || eyebrow) && (
            <span aria-hidden className="text-grayscale-6">
              /
            </span>
          )}

          {codigo && (
            <span className="font-mono text-[10px] font-medium tracking-wide text-grayscale-8">
              {codigo}
            </span>
          )}

          {codigo && eyebrow && (
            <span aria-hidden className="text-grayscale-6">
              ·
            </span>
          )}

          {eyebrow && <span>{eyebrow}</span>}
        </div>

        <h1 className="titulo-pagina text-grayscale-12">{titulo}</h1>

        {descripcion && (
          <p className="max-w-xl text-[13px] leading-relaxed text-grayscale-10">
            {descripcion}
          </p>
        )}

        {meta && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">{meta}</div>
        )}
      </div>

      {acciones && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {acciones}
        </div>
      )}
    </header>
  );
}
