const RELATIVO = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** "10 nov, 19:28" */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "10 de noviembre de 2026, 19:28" */
export function fechaCompleta(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** "hace 3 h", "ayer", o fecha corta cuando supera la semana. */
export function tiempoRelativo(iso: string): string {
  const diferencia = Date.parse(iso) - Date.now();
  const absoluta = Math.abs(diferencia);

  if (absoluta < MINUTO) return "ahora";
  if (absoluta < HORA) return RELATIVO.format(Math.round(diferencia / MINUTO), "minute");
  if (absoluta < DIA) return RELATIVO.format(Math.round(diferencia / HORA), "hour");
  if (absoluta < 7 * DIA) return RELATIVO.format(Math.round(diferencia / DIA), "day");

  return fechaCorta(iso);
}
