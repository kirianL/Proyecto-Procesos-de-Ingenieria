import {
  CheckCircleIcon,
  ClipboardTextIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";
import { EvidenceGallery } from "@/components/ui/EvidenceGallery";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import { fechaCompleta } from "@/helpers/fecha";
import { nombreLimpio } from "@/helpers/iniciales";
import type { Estado, EventoConAutor } from "@/lib/mantenimiento/types";

interface TimelineProps {
  eventos: EventoConAutor[];
  className?: string;
}

const ICONO_ESTADO: Record<
  Estado,
  {
    icon: typeof ClipboardTextIcon;
    color: string;
    verbo: string;
    etiqueta: string;
  }
> = {
  REGISTRADA: {
    icon: ClipboardTextIcon,
    color: "text-amber-600 dark:text-amber-400",
    verbo: "registró la solicitud",
    etiqueta: "Registrada",
  },
  EN_PROCESO: {
    icon: WrenchIcon,
    color: "text-blue-600 dark:text-blue-400",
    verbo: "movió la solicitud a",
    etiqueta: "En atención",
  },
  CERRADA: {
    icon: CheckCircleIcon,
    color: "text-emerald-600 dark:text-emerald-400",
    verbo: "finalizó y cerró como",
    etiqueta: "Cerrada",
  },
};

export function Timeline({ eventos, className }: TimelineProps) {
  if (eventos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-grayscale-4 px-6 py-7 text-center text-[12px] text-grayscale-9">
        Todavía no hay actividad registrada para esta solicitud.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[11px] font-medium text-grayscale-9">
        Actividad reciente
      </p>

      <ol className="stagger relative space-y-5">
        {eventos.map((evento, index) => {
          const ultimo = index === eventos.length - 1;
          const config = ICONO_ESTADO[evento.estadoNuevo];
          const Icon = config.icon;
          const autorNombre = nombreLimpio(evento.autor.nombre);

          return (
            <li
              key={evento.id}
              className="relative flex items-start gap-3"
              style={{ "--stagger": index } as CSSProperties}
            >
              {/* Línea vertical de conexión entre los nodos */}
              {!ultimo && (
                <span
                  aria-hidden
                  className="absolute bottom-[-20px] left-[13.5px] top-7 w-px bg-grayscale-3 dark:bg-grayscale-4/50"
                />
              )}

              {/* Pastilla cuadrada redondeada con icono (estilo Activity feed) */}
              <span
                skullet-block=""
                className={cn(
                  "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg border border-grayscale-3/90 bg-white shadow-2xs dark:border-grayscale-4/60 dark:bg-grayscale-3",
                  config.color,
                )}
              >
                <Icon size={14} weight="bold" />
              </span>

              {/* Contenido del evento */}
              <div className="min-w-0 flex-1 pt-0.5">
                {/* Oración principal en una sola línea limpia */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px] leading-snug">
                  <p className="text-grayscale-10">
                    <span className="font-semibold text-grayscale-12">
                      {autorNombre}
                    </span>{" "}
                    <span>{config.verbo}</span>{" "}
                    <span className="font-semibold text-grayscale-12">
                      {config.etiqueta}
                    </span>
                    <span className="text-grayscale-8">
                      {" "}
                      · <TiempoRelativo fecha={evento.fecha} />
                    </span>
                  </p>

                  <span className="font-mono text-[10.5px] text-grayscale-8">
                    {evento.autor.cargo}
                  </span>
                </div>

                {/* Burbuja de nota técnica si existe */}
                {evento.nota && (
                  <div className="mt-2 rounded-xl border border-grayscale-3/85 bg-grayscale-1/70 px-3.5 py-2.5 dark:border-white/[0.11] dark:bg-grayscale-3/35">
                    <p className="text-[12.5px] leading-relaxed text-grayscale-11">
                      {evento.nota}
                    </p>
                  </div>
                )}

                {evento.adjuntos && evento.adjuntos.length > 0 && (
                  <EvidenceGallery
                    adjuntos={evento.adjuntos}
                    compacto
                    className="mt-2.5"
                  />
                )}

                <span className="sr-only">{fechaCompleta(evento.fecha)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
