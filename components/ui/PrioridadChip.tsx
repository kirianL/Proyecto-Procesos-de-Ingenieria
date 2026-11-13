import { cn } from "@/helpers/classname-helper";

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

/**
 * Prioridad de la solicitud.
 *
 * Pastilla pastel sin punto ni borde: solo tinte y texto, como Low / Medium / High.
 */
const CONFIG: Record<
  Prioridad,
  { label: string; tono: string; descripcion: string }
> = {
  BAJA: {
    label: "Baja",
    tono: "bg-green-3 text-green-11",
    descripcion: "Mantenimiento preventivo",
  },
  MEDIA: {
    label: "Media",
    tono: "bg-orange-3 text-orange-11",
    descripcion: "Falla no crítica",
  },
  ALTA: {
    label: "Alta",
    tono: "bg-red-3 text-red-11",
    descripcion: "Afecta operaciones regulares",
  },
  URGENTE: {
    label: "Urgente",
    tono: "bg-tomato-4 text-tomato-11",
    descripcion: "Riesgo inminente o suspensión total",
  },
};

export function PrioridadChip({
  prioridad,
  size = "sm",
  conTexto = true,
  className,
}: {
  prioridad: Prioridad;
  size?: "sm" | "md";
  conTexto?: boolean;
  className?: string;
}) {
  const actual = CONFIG[prioridad] ?? CONFIG.MEDIA;

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
      {conTexto ? (
        <span>{actual.label}</span>
      ) : (
        <span className="sr-only">{actual.label}</span>
      )}
    </span>
  );
}

export { CONFIG as PRIORIDADES };
