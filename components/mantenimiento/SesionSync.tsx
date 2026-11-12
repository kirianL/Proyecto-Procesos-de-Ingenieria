"use client";

import { useEffect } from "react";
import { setUsuarioActual } from "@/lib/mantenimiento/store";

export const CLAVE_SESION = "mantenimiento:usuario";

let sesionRestaurada = false;

/**
 * Sincroniza el perfil guardado en `localStorage` sin desmontar ni reemplazar
 * el árbol de la aplicación, permitiendo que Skullet mida el DOM real desde el
 * primer pintado y ejecute su transición nativa `sweep`.
 */
export function SesionSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (sesionRestaurada) return;
    sesionRestaurada = true;

    try {
      const guardado = window.localStorage.getItem(CLAVE_SESION);
      if (guardado) {
        const usuario = setUsuarioActual(guardado);
        window.dispatchEvent(
          new CustomEvent("usuario-cambiado", { detail: usuario }),
        );
      }
    } catch {
      // Almacenamiento no disponible: seguimos con el perfil por defecto.
    }
  }, []);

  return <>{children}</>;
}

export function recordarUsuario(id: string) {
  try {
    window.localStorage.setItem(CLAVE_SESION, id);
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión sigue en memoria.
  }
}
