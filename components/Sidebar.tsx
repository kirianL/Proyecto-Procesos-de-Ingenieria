"use client";

import {
  ChartLineIcon,
  ClipboardTextIcon,
  LockSimpleIcon,
  PlusCircleIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SquaresFourIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleSelector } from "@/components/mantenimiento/RoleSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { cn } from "@/helpers/classname-helper";
import {
  getBandejaMantenimiento,
  getSolicitudesPorCreador,
  getUsuarioActual,
} from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";

const NAV_PRINCIPALES: {
  href: string;
  label: string;
  icon: typeof ClipboardTextIcon;
  roles: Usuario["rol"][];
}[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: SquaresFourIcon,
    roles: ["EMPLEADO", "TECNICO", "JEFATURA"],
  },
  {
    href: "/mis-solicitudes",
    label: "Mis solicitudes",
    icon: ClipboardTextIcon,
    roles: ["EMPLEADO"],
  },
  {
    href: "/solicitudes/nueva",
    label: "Nueva solicitud",
    icon: PlusCircleIcon,
    roles: ["EMPLEADO"],
  },
];

const NAV_OPERACION: {
  href: string;
  label: string;
  icon: typeof ClipboardTextIcon;
  roles: Usuario["rol"][];
}[] = [
  {
    href: "/mantenimiento",
    label: "Bandeja técnica",
    icon: WrenchIcon,
    roles: ["TECNICO", "JEFATURA"],
  },
  {
    href: "/indicadores",
    label: "Indicadores",
    icon: ChartLineIcon,
    roles: ["JEFATURA"],
  },
];

const ETIQUETA_ROL: Record<Usuario["rol"], string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico",
  JEFATURA: "Jefatura",
};

interface SidebarNavContentProps {
  onNavigate?: () => void;
  onToggle?: () => void;
  colapsado?: boolean;
}

function SidebarNavContent({
  onNavigate,
  onToggle,
  colapsado = false,
}: SidebarNavContentProps) {
  const pathname = usePathname();
  const [usuarioActual, setUsuarioActualState] = useState<Usuario>(
    getUsuarioActual(),
  );
  const [conteoBandeja, setConteoBandeja] = useState<number>(0);
  const [conteoMisSolicitudes, setConteoMisSolicitudes] = useState<number>(0);

  useEffect(() => {
    const handleUserChange = () => {
      const u = getUsuarioActual();
      setUsuarioActualState(u);
      setConteoBandeja(
        getBandejaMantenimiento().filter((s) => s.estado !== "CERRADA").length,
      );
      setConteoMisSolicitudes(getSolicitudesPorCreador(u.id).length);
    };
    handleUserChange();
    window.addEventListener("usuario-cambiado", handleUserChange);
    return () =>
      window.removeEventListener("usuario-cambiado", handleUserChange);
  }, []);

  const renderNavLink = (item: (typeof NAV_PRINCIPALES)[number]) => {
    const activo = pathname === item.href;
    const disponible = item.roles.includes(usuarioActual.rol);
    const Icon = item.icon;
    const rolesTexto = item.roles.map((rol) => ETIQUETA_ROL[rol]).join(" / ");

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        onClick={() => {
          onNavigate?.();
        }}
        aria-current={activo ? "page" : undefined}
        title={
          colapsado
            ? disponible
              ? item.label
              : `${item.label} (${rolesTexto})`
            : disponible
              ? undefined
              : `Disponible para ${rolesTexto}`
        }
        className={cn(
          "group flex items-center rounded-[10px] text-[13px] outline-none transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-grayscale-7/40",
          colapsado
            ? "mx-auto size-9 justify-center px-0"
            : "gap-2.5 px-3 py-2",
          activo
            ? "border border-black/[0.08] bg-white font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.06)] dark:border-white/[0.11] dark:bg-[#191917] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            : "border border-transparent text-grayscale-10 hover:bg-black/[0.05] hover:text-grayscale-12 dark:hover:bg-white/[0.06]",
          !disponible && !activo && "text-grayscale-9",
        )}
      >
        <Icon
          size={16}
          weight={activo ? "fill" : "regular"}
          className={cn(
            "shrink-0 transition-[color,transform] duration-150 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]",
            activo
              ? "text-grayscale-12"
              : "text-grayscale-9 group-hover:text-grayscale-12",
          )}
        />
        {!colapsado ? <span className="truncate">{item.label}</span> : null}

        {!colapsado && disponible && item.href === "/mis-solicitudes" && (
          <SlotNumber
            value={conteoMisSolicitudes}
            duration={260}
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10.5px] transition-colors duration-150",
              activo
                ? "bg-grayscale-2 text-grayscale-11 dark:bg-white/[0.08]"
                : "bg-black/[0.055] text-grayscale-10 group-hover:bg-black/[0.08] group-hover:text-grayscale-12 dark:bg-white/[0.08]",
            )}
          />
        )}

        {!colapsado && disponible && item.href === "/mantenimiento" && (
          <SlotNumber
            value={conteoBandeja}
            duration={260}
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10.5px] transition-colors duration-150",
              activo
                ? "bg-grayscale-2 text-grayscale-11 dark:bg-white/[0.08]"
                : "bg-black/[0.055] text-grayscale-10 group-hover:bg-black/[0.08] group-hover:text-grayscale-12 dark:bg-white/[0.08]",
            )}
          />
        )}

        {!colapsado && !disponible && (
          <LockSimpleIcon
            size={12}
            className="ml-auto shrink-0 text-grayscale-8"
            aria-hidden
          />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Cabecera del sidebar: Marca + Botón de colapsar/expandir */}
      <div
        className={cn(
          "flex pt-0.5",
          colapsado
            ? "flex-col items-center gap-2.5 px-0"
            : "items-center justify-between gap-2 px-1",
        )}
      >
        <Link
          href="/"
          prefetch
          onClick={onNavigate}
          title={colapsado ? "Mantenimiento" : undefined}
          className="group flex min-w-0 items-center gap-2.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1 shadow-2xs transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:-rotate-3">
            <WrenchIcon size={14} weight="fill" />
          </span>
          {!colapsado ? (
            <span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-grayscale-12">
              Mantenimiento
            </span>
          ) : null}
        </Link>

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              colapsado ? "Expandir barra lateral" : "Colapsar barra lateral"
            }
            title={
              colapsado
                ? "Expandir barra lateral (Ctrl+B)"
                : "Colapsar barra lateral (Ctrl+B)"
            }
            className={cn(
              "flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-grayscale-9 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.06] hover:text-grayscale-12 active:scale-[0.94] dark:hover:bg-white/[0.08]",
              colapsado
                ? "size-8 border border-grayscale-4/70 bg-white/70 dark:border-white/[0.10] dark:bg-white/[0.04]"
                : "size-7",
            )}
          >
            <SidebarSimpleIcon size={16} />
          </button>
        ) : null}
      </div>

      {/* Navegación principal */}
      <nav className={cn("mt-1 flex flex-col", colapsado ? "gap-3.5" : "gap-5")}>
        <div className="flex flex-col gap-1.5">
          {NAV_PRINCIPALES.map(renderNavLink)}
        </div>

        <div className="flex flex-col gap-1.5">
          {colapsado ? (
            <div className="mx-auto my-0.5 h-px w-6 bg-grayscale-4/70 dark:bg-white/[0.10]" />
          ) : (
            <div className="section-label px-3 pb-0.5">Operación</div>
          )}
          {NAV_OPERACION.map(renderNavLink)}
        </div>

        <div className="flex flex-col gap-1.5">
          {colapsado ? (
            <div className="mx-auto my-0.5 h-px w-6 bg-grayscale-4/70 dark:bg-white/[0.10]" />
          ) : (
            <div className="section-label px-3 pb-0.5">Cuenta</div>
          )}
          <Link
            href="/login"
            prefetch
            title={colapsado ? "Cerrar sesión" : undefined}
            onClick={() => {
              onNavigate?.();
            }}
            className={cn(
              "group flex items-center rounded-[10px] border border-transparent text-[13px] text-grayscale-10 outline-none transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.05] hover:text-grayscale-12 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-grayscale-7/40 dark:hover:bg-white/[0.06]",
              colapsado
                ? "mx-auto size-9 justify-center px-0"
                : "gap-2.5 px-3 py-2",
            )}
          >
            <SignOutIcon
              size={16}
              className="shrink-0 text-grayscale-9 transition-[color,transform] duration-150 ease-[var(--ease-out-soft)] group-hover:scale-[1.06] group-hover:text-grayscale-12"
            />
            {!colapsado ? <span className="truncate">Cerrar sesión</span> : null}
          </Link>
        </div>
      </nav>

      {/* Pie del sidebar: Tema + Perfil activo abajo */}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        {!colapsado ? (
          <div className="flex items-center justify-between gap-2 px-1.5">
            <span className="text-[11px] font-medium text-grayscale-9">
              Apariencia
            </span>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}

        <RoleSelector
          usuarioActual={usuarioActual}
          placement="top"
          iconOnly={colapsado}
        />
      </div>
    </div>
  );
}

interface SidebarProps {
  abierto?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ abierto = true, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "no-scrollbar fixed left-0 top-0 z-40 hidden h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-[#ECEBE7] transition-[width,padding] duration-250 ease-[var(--ease-out-soft)] xl:flex dark:bg-[#090908]",
        abierto ? "w-64 p-4 2xl:w-72" : "w-[68px] px-2.5 py-4",
      )}
    >
      <SidebarNavContent onToggle={onToggle} colapsado={!abierto} />
    </aside>
  );
}

export { SidebarNavContent };
