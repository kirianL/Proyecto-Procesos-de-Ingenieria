import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

/** Panel suave con filas icono / etiqueta / valor, al estilo de las fichas. */
export function InfoPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "surface-soft divide-y divide-grayscale-3/70 px-3.5 dark:divide-grayscale-3/50",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function InfoRow({
  icon: IconComponent,
  label,
  children,
  className,
}: {
  icon?: Icon;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2.5",
        className,
      )}
    >
      <dt className="flex shrink-0 items-center gap-2 text-[12px] text-grayscale-9">
        {IconComponent && (
          <IconComponent size={14} className="text-sand-8/80" />
        )}
        {label}
      </dt>
      <dd className="min-w-0 text-right text-[12px] font-medium text-grayscale-12">
        {children}
      </dd>
    </div>
  );
}
