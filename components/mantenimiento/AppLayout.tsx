"use client";

import {
  CaretRightIcon,
  SidebarSimpleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import { SesionSync } from "@/components/mantenimiento/SesionSync";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/helpers/classname-helper";

interface AppLayoutProps {
  children: ReactNode;
}

function getRutaActualLabel(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/mis-solicitudes") return "Mis solicitudes";
  if (pathname === "/solicitudes/nueva") return "Nueva solicitud";
  if (pathname.startsWith("/solicitudes/")) {
    const id = pathname.replace("/solicitudes/", "");
    return `Solicitud ${id}`;
  }
  if (pathname === "/mantenimiento") return "Bandeja técnica";
  if (pathname === "/indicadores") return "Indicadores";
  return "Espacio de trabajo";
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const esLogin = pathname === "/login";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarAbierto((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (esLogin) {
    return (
      <div className="app-canvas min-h-dvh w-full text-grayscale-12">
        <SesionSync>{children}</SesionSync>
      </div>
    );
  }

  const seccionActual = getRutaActualLabel(pathname);

  return (
    <div className="flex min-h-dvh w-full bg-[#ECEBE7] text-grayscale-12 xl:h-dvh xl:overflow-hidden dark:bg-[#090908]">
      <SesionSync>
        <Sidebar
          abierto={sidebarAbierto}
          onToggle={() => setSidebarAbierto((prev) => !prev)}
        />
        <MobileHeader />

        <main
          className={cn(
            "flex min-h-dvh w-full flex-1 flex-col pt-[4.5rem] transition-[padding-left] duration-250 ease-[var(--ease-out-soft)] md:pt-0 xl:h-dvh xl:min-h-0 xl:overflow-hidden",
            sidebarAbierto ? "xl:pl-64 2xl:pl-72" : "xl:pl-[68px]",
          )}
        >
          {/* Franja superior fija conectada al sidebar */}
          <div className="hidden h-12 shrink-0 items-center gap-2 px-5 text-[12px] text-grayscale-9 xl:flex">
            {!sidebarAbierto ? (
              <button
                type="button"
                onClick={() => setSidebarAbierto(true)}
                aria-label="Expandir barra lateral"
                title="Expandir barra lateral (Ctrl+B)"
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-grayscale-10 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.06] hover:text-grayscale-12 active:scale-[0.94] dark:hover:bg-white/[0.08]"
              >
                <SidebarSimpleIcon size={16} />
              </button>
            ) : null}

            <div className="flex items-center gap-1.5">
              <WrenchIcon size={13} className="text-grayscale-8" />
              <span className="font-medium text-grayscale-10">
                Mantenimiento
              </span>
              <CaretRightIcon size={11} className="text-grayscale-7" />
              <span className="font-medium text-grayscale-12">
                {seccionActual}
              </span>
            </div>
          </div>

          {/* Marco redondeado fijo con recorte limpio y scroll interno */}
          <div className="flex flex-1 flex-col xl:min-h-0 xl:overflow-hidden xl:rounded-tl-[20px] xl:border-l xl:border-t xl:border-[#DAD8D2] xl:bg-white dark:xl:border-white/[0.12] dark:xl:bg-[#131312]">
            <div className="no-scrollbar flex flex-1 flex-col xl:overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[84rem] flex-1 flex-col px-4 pb-8 pt-4 md:px-8 md:pb-10 md:pt-8 xl:px-10 xl:py-8 2xl:px-12 2xl:py-10">
                {children}
              </div>
            </div>
          </div>
        </main>
      </SesionSync>
    </div>
  );
}
