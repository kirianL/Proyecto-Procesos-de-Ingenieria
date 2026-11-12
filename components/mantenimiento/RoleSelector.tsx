"use client";

import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { recordarUsuario } from "@/components/mantenimiento/SesionSync";
import { cn } from "@/helpers/classname-helper";
import { iniciales, nombreLimpio } from "@/helpers/iniciales";
import {
  setUsuarioActual,
  USUARIOS_INICIALES,
} from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";

interface RoleSelectorProps {
  usuarioActual: Usuario;
  compact?: boolean;
}

export function RoleSelector({
  usuarioActual,
  compact = false,
}: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelect = (user: Usuario) => {
    setOpen(false);

    if (user.id === usuarioActual.id) return;

    // Actualización optimista: la sesión local cambia antes de navegar.
    setUsuarioActual(user.id);
    recordarUsuario(user.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("usuario-cambiado", { detail: user }),
      );
    }

    // Persistencia en segundo plano, sin bloquear la transición.
    fetch("/api/auth/cambiar-usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id }),
    }).catch(() => {});

    if (user.rol === "EMPLEADO") {
      router.push("/mis-solicitudes");
    } else if (user.rol === "TECNICO") {
      router.push("/mantenimiento");
    } else {
      router.push("/indicadores");
    }
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((valor) => !valor)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-grayscale-3/80 bg-grayscale-1 text-left transition-[border-color,background-color,box-shadow] duration-150 hover:border-grayscale-4 hover:shadow-[0_1px_2px_rgba(28,22,16,0.04)] dark:bg-grayscale-2 dark:hover:border-grayscale-4",
          compact ? "p-1.5" : "p-2",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-grayscale-3 bg-grayscale-2 font-mono text-[10px] font-semibold text-grayscale-11 dark:border-grayscale-4 dark:bg-grayscale-3">
            {iniciales(usuarioActual.nombre)}
          </span>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[12.5px] font-semibold text-grayscale-12">
              {nombreLimpio(usuarioActual.nombre)}
            </span>
            <span className="mt-1 truncate text-[10.5px] text-grayscale-9">
              {usuarioActual.rol.toLowerCase()} · {usuarioActual.departamento}
            </span>
          </div>
        </div>
        <CaretRightIcon
          size={13}
          className={cn(
            "shrink-0 text-grayscale-8 transition-transform duration-200 ease-out",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label="Cambiar perfil activo"
            className="menu-pop absolute left-0 right-0 top-full z-50 mt-1.5 flex flex-col rounded-xl border border-grayscale-3 bg-grayscale-1 p-1.5 shadow-[0_18px_40px_-16px_rgba(28,22,16,0.35)] dark:border-grayscale-4 dark:bg-grayscale-2"
          >
            <div className="section-label px-2 py-1.5">Cambiar perfil</div>

            <div className="flex flex-col gap-0.5">
              {USUARIOS_INICIALES.map((user) => {
                const seleccionado = user.id === usuarioActual.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={seleccionado}
                    onClick={() => handleSelect(user)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-150",
                      seleccionado
                        ? "bg-grayscale-2 text-grayscale-12 dark:bg-grayscale-3"
                        : "text-grayscale-11 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/70",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-grayscale-3 font-mono text-[9px] font-semibold text-grayscale-11">
                        {iniciales(user.nombre)}
                      </span>
                      <div className="flex min-w-0 flex-col leading-none">
                        <span className="truncate text-[12px] font-medium">
                          {nombreLimpio(user.nombre)}
                        </span>
                        <span className="mt-1 truncate text-[10px] text-grayscale-9">
                          {user.rol.toLowerCase()} · {user.departamento}
                        </span>
                      </div>
                    </div>
                    {seleccionado && (
                      <CheckIcon
                        size={13}
                        weight="bold"
                        className="shrink-0 text-grayscale-12"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
