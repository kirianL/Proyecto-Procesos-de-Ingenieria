import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

interface EmptyStateProps {
  icon: Icon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: IconComponent,
  titulo,
  descripcion,
  accion,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "card flex flex-col items-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-grayscale-3 bg-grayscale-2 text-grayscale-9">
        <IconComponent size={20} />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-grayscale-12">{titulo}</h3>
        {descripcion && (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-grayscale-10">
            {descripcion}
          </p>
        )}
      </div>
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  );
}
