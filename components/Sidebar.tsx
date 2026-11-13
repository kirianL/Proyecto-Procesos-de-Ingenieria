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
}

function SidebarNavContent({ onNavigate, onToggle }: SidebarNavContentProps) {
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
        title={disponible ? undefined : `Disponible para ${rolesTexto}`}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.985]",
          activo
            ? "border border-grayscale-3/80 bg-white font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.06)] dark:border-white/[0.10] dark:bg-[#191917] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            : "border border-transparent text-grayscale-10 hover:bg-black/[0.04] hover:text-grayscale-12 dark:hover:bg-white/[0.04]",
          !disponible && !activo && "text-grayscale-9",
        )}
      >
        <Icon
          size={16}
          weight={activo ? "fill" : "regular"}
          className={cn(
            "shrink-0 transition-colors duration-150",
            activo ? "text-grayscale-12" : "text-grayscale-9 group-hover:text-grayscale-11",
          )}
        />
        <span className="truncate">{item.label}</span>

        {disponible && item.href === "/mis-solicitudes" && (
          <SlotNumber
            value={conteoMisSolicitudes}
            duration={260}
            className="ml-auto rounded-full bg-black/[0.06] px-1.5 py-0.5 font-mono text-[10.5px] text-grayscale-10 group-hover:text-grayscale-12 dark:bg-white/[0.08]"
          />
        )}

        {disponible && item.href === "/mantenimiento" && (
          <SlotNumber
            value={conteoBandeja}
            duration={260}
            className="ml-auto rounded-full bg-black/[0.06] px-1.5 py-0.5 font-mono text-[10.5px] text-grayscale-10 group-hover:text-grayscale-12 dark:bg-white/[0.08]"
          />
        )}

        {!disponible && (
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
      {/* Cabecera del sidebar: Marca + Botón de colapsar */}
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <Link
          href="/"
          prefetch
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-2.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1 shadow-2xs transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:-rotate-3">
            <WrenchIcon size={14} weight="fill" />
          </span>
          <span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-grayscale-12">
            Mantenimiento
          </span>
        </Link>

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Cerrar barra lateral"
            title="Cerrar barra lateral (Ctrl+B)"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-grayscale-9 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.05] hover:text-grayscale-12 active:scale-[0.94] dark:hover:bg-white/[0.07]"
          >
            <SidebarSimpleIcon size={16} />
          </button>
        ) : null}
      </div>

      {/* Navegación principal */}
      <nav className="mt-1 flex flex-col gap-5">
        <div className="flex flex-col gap-0.5">
          {NAV_PRINCIPALES.map(renderNavLink)}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="section-label px-2.5 pb-1">Operación</div>
          {NAV_OPERACION.map(renderNavLink)}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="section-label px-2.5 pb-1">Cuenta</div>
          <Link
            href="/login"
            prefetch
            onClick={() => {
              onNavigate?.();
            }}
            className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-[7px] text-[13px] text-grayscale-10 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.04] hover:text-grayscale-12 active:scale-[0.985] dark:hover:bg-white/[0.04]"
          >
            <SignOutIcon
              size={16}
              className="shrink-0 text-grayscale-9 transition-colors duration-150 group-hover:text-grayscale-11"
            />
            <span className="truncate">Cerrar sesión</span>
          </Link>
        </div>
      </nav>

      {/* Pie del sidebar: Tema + Perfil activo abajo */}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between gap-2 px-1.5">
          <span className="text-[11px] font-medium text-grayscale-9">
            Apariencia
          </span>
          <ThemeToggle />
        </div>

        <RoleSelector usuarioActual={usuarioActual} placement="top" />
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
      aria-hidden={!abierto}
      className={cn(
        "no-scrollbar fixed left-0 top-0 z-40 hidden h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#F3F2EF] p-4 transition-[transform,opacity] duration-250 ease-[var(--ease-out-soft)] xl:flex 2xl:w-72 dark:bg-[#0B0B0A]",
        abierto
          ? "translate-x-0 opacity-100"
          : "-translate-x-full pointer-events-none opacity-0",
      )}
    >
      <SidebarNavContent onToggle={onToggle} />
    </aside>
  );
}

export { SidebarNavContent };
