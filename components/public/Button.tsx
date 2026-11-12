import Link from "next/link";
import { cn } from "@/helpers/classname-helper";

type ButtonSharedProps = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

type ButtonProps =
  | (ButtonSharedProps & React.ComponentPropsWithoutRef<"button">)
  | (ButtonSharedProps &
      React.ComponentPropsWithoutRef<"a"> & {
        href: string;
        prefetch?: boolean;
      });

export default function Button(props: ButtonProps) {
  const { variant = "primary", className } = props;
  const baseClasses =
    "inline-flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium outline-grayscale-9 transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    primary:
      "bg-grayscale-12 text-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.14)] hover:bg-grayscale-11 dark:hover:bg-grayscale-11",
    secondary:
      "border border-grayscale-4 bg-grayscale-1 text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:border-grayscale-4 dark:bg-grayscale-2 dark:hover:bg-grayscale-3",
  };

  const classes = cn(baseClasses, variantClasses[variant], className);

  if ("href" in props) {
    const {
      variant: _variant,
      className: _className,
      children,
      href,
      prefetch = true,
      ...anchorProps
    } = props;

    const isInternal = href.startsWith("/") || href.startsWith("#");

    if (isInternal) {
      return (
        <Link
          href={href}
          prefetch={prefetch}
          className={classes}
          {...anchorProps}
        >
          {children}
        </Link>
      );
    }

    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const {
    variant: _variant,
    className: _className,
    children,
    ...buttonProps
  } = props;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
