"use client";

import {
  ChartLineIcon,
  ClipboardTextIcon,
  LockSimpleIcon,
  PlusCircleIcon,
  SignOutIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleSelector } from "@/components/mantenimiento/RoleSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/helpers/classname-helper";
import {
  getBandejaMantenimiento,
  getSolicitudesPorCreador,
  getUsuarioActual,
} from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";
import { SlotNumber } from "@/components/ui/SlotNumber";

const NAV_LINKS: {
  href: string;
  label: string;
  icon: typeof ClipboardTextIcon;
  roles: Usuario["rol"][];
}[] = [
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
  {
    href: "/login",
    label: "Cerrar sesión",
    icon: SignOutIcon,
    roles: ["EMPLEADO", "TECNICO", "JEFATURA"],
  },
];

const ETIQUETA_ROL: Record<Usuario["rol"], string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico",
  JEFATURA: "Jefatura",
};

function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
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

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-4">
        {/* Marca */}
        <Link
          href="/"
          prefetch
          onClick={onNavigate}
          className="group flex items-center gap-2.5 px-1"
        >
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-grayscale-12 text-grayscale-1 shadow-sm transition-transform duration-200 ease-out group-hover:-rotate-3">
            <WrenchIcon size={16} weight="fill" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[14px] font-semibold tracking-[-0.02em] text-grayscale-12">
              Mantenimiento
            </span>
            <span className="mt-1 text-[10.5px] text-grayscale-9">
              Servicios internos
            </span>
          </span>
        </Link>

        {/* Perfil activo */}
        <RoleSelector usuarioActual={usuarioActual} />

        {/* Navegación */}
        <nav className="flex flex-col gap-0.5">
          <div className="section-label px-2 pb-1.5">Espacio de trabajo</div>

          {NAV_LINKS.map((item) => {
            const activo = pathname === item.href;
            const disponible = item.roles.includes(usuarioActual.rol);
            const Icon = item.icon;
            const rolesTexto = item.roles
              .map((rol) => ETIQUETA_ROL[rol])
              .join(" / ");

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
                  disponible
                    ? undefined
                    : `Disponible para ${rolesTexto}`
                }
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-[background-color,color,box-shadow,border-color] duration-150",
                  activo
                    ? "border border-grayscale-3/80 bg-grayscale-1 font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.05)] dark:bg-grayscale-2"
                    : "border border-transparent text-grayscale-10 hover:bg-grayscale-2/80 hover:text-grayscale-12 dark:hover:bg-grayscale-2/60",
                  !disponible && !activo && "text-grayscale-9",
                )}
              >
                <Icon
                  size={16}
                  weight={activo ? "fill" : "regular"}
                  className={cn(
                    "shrink-0 transition-colors duration-150",
                    activo ? "text-sand-9/80" : "text-sand-7/80",
                  )}
                />
                <span className="truncate">{item.label}</span>

                {disponible && item.href === "/mis-solicitudes" && (
                  <SlotNumber
                    value={conteoMisSolicitudes}
                    duration={260}
                    className="ml-auto rounded-full bg-grayscale-2/90 px-1.5 py-0.5 text-[10.5px] font-mono text-grayscale-10 group-hover:text-grayscale-12 dark:bg-grayscale-3/60"
                  />
                )}

                {disponible && item.href === "/mantenimiento" && (
                  <SlotNumber
                    value={conteoBandeja}
                    duration={260}
                    className="ml-auto rounded-full bg-grayscale-2/90 px-1.5 py-0.5 text-[10.5px] font-mono text-grayscale-10 group-hover:text-grayscale-12 dark:bg-grayscale-3/60"
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
          })}
        </nav>
      </div>

      {/* Pie del panel */}
      <div className="mt-auto flex items-center justify-between gap-2 px-1">
        <div className="flex flex-col leading-none">
          <span className="section-label">Tema</span>
          <span className="mt-1 text-[10px] text-grayscale-8">
            Claro / oscuro
          </span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="app-canvas fixed left-0 top-0 z-40 hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-grayscale-3/70 p-4 xl:flex 2xl:w-72 dark:border-grayscale-3/50">
      <SidebarNavContent />
    </aside>
  );
}

export { SidebarNavContent };
