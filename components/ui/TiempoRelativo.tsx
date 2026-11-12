"use client";

import { useEffect, useState } from "react";
import { fechaCompleta, fechaCorta, tiempoRelativo } from "@/helpers/fecha";

/**
 * En el servidor muestra la fecha corta; tras hidratar cambia al tiempo
 * relativo. Evita desajustes de hidratación porque el primer render
 * del cliente es idéntico al del servidor.
 */
export function TiempoRelativo({
  fecha,
  className,
  completo = false,
}: {
  fecha: string;
  className?: string;
  completo?: boolean;
}) {
  const [texto, setTexto] = useState(() => fechaCorta(fecha));

  useEffect(() => {
    setTexto(tiempoRelativo(fecha));
  }, [fecha]);

  return (
    <time
      dateTime={fecha}
      title={completo ? fechaCompleta(fecha) : fechaCorta(fecha)}
      className={className}
      suppressHydrationWarning
    >
      {texto}
    </time>
  );
}
