import { cn } from "@/helpers/classname-helper";
import type { Estado } from "@/lib/mantenimiento/types";

interface EstadoBadgeProps {
  estado: Estado;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Estado de la solicitud.
 *
 * Pastilla pastel con punto y texto del mismo tono, sin borde.
 */
const CONFIG: Record<
  Estado,
  { label: string; dot: string; tono: string; descripcion: string }
> = {
  REGISTRADA: {
    label: "Registrada",
    dot: "bg-amber-9",
    tono: "bg-amber-3 text-amber-11",
    descripcion: "Pendiente de asignación o diagnóstico",
  },
  EN_PROCESO: {
    label: "En proceso",
    dot: "bg-blue-9",
    tono: "bg-blue-3 text-blue-11",
    descripcion: "Atención técnica en curso",
  },
  CERRADA: {
    label: "Cerrada",
    dot: "bg-green-9",
    tono: "bg-green-3 text-green-11",
    descripcion: "Servicio finalizado y documentado",
  },
};

export function EstadoBadge({
  estado,
  className,
  size = "md",
}: EstadoBadgeProps) {
  const actual = CONFIG[estado] ?? CONFIG.REGISTRADA;

  return (
    <span
      title={actual.descripcion}
      className={cn(
        "badge",
        actual.tono,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      <span className={cn("badge-dot", actual.dot)} />
      <span>{actual.label}</span>
    </span>
  );
}
