import Button from "@/components/public/Button";
import { cn } from "@/helpers/classname-helper";

interface BottomBarProps {
  primaryLabel?: string;
  primaryHref?: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  statusInfo?: {
    title: string;
    subtitle?: string;
  };
  shortcuts?: {
    key: string;
    label: string;
  }[];
  className?: string;
}

export function BottomBar({
  primaryLabel,
  primaryHref,
  onPrimaryClick,
  primaryDisabled,
  statusInfo,
  shortcuts = [],
  className,
}: BottomBarProps) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col gap-3 border-t border-grayscale-3/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-grayscale-3/50",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[12px] font-medium text-grayscale-11">
          {statusInfo?.title ?? "Gestión de solicitudes internas"}
        </p>
        {statusInfo?.subtitle && (
          <p className="truncate text-[11px] text-grayscale-9">
            {statusInfo.subtitle}
          </p>
        )}

        {shortcuts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-grayscale-9">
            {shortcuts.map((sc) => (
              <span
                key={sc.key}
                className="flex items-center gap-1.5 whitespace-nowrap text-[10.5px]"
              >
                <kbd className="rounded-[5px] border border-grayscale-4 bg-grayscale-1 px-1.5 py-0.5 font-mono text-[9.5px] text-grayscale-10 shadow-[0_1px_0_rgba(28,22,16,0.05)] dark:bg-grayscale-2">
                  {sc.key}
                </kbd>
                <span className="text-grayscale-9">{sc.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {primaryLabel && (
        <div className="shrink-0">
          {primaryHref ? (
            <Button
              href={primaryHref}
              variant="primary"
              className={cn(
                primaryDisabled && "pointer-events-none opacity-50",
              )}
            >
              {primaryLabel}
            </Button>
          ) : (
            <Button
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              variant="primary"
            >
              {primaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
