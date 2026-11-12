/** Iniciales para avatares: "Carlos Méndez (Empleado A)" → "CM". */
export function iniciales(nombre: string): string {
  return nombre
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

/** Nombre sin el sufijo de demostración entre paréntesis. */
export function nombreLimpio(nombre: string): string {
  return nombre.replace(/\s*\(.*?\)/g, "").trim();
}
