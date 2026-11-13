"use client";

import {
  CalendarBlankIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { cn } from "@/helpers/classname-helper";

interface DateRangePickerProps {
  desde: string;
  hasta: string;
  activo: boolean;
  onChange: (rango: { desde: string; hasta: string }) => void;
  onActivate: () => void;
  onClear: () => void;
  fechasConActividad?: string[];
  className?: string;
}

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS_SEMANA = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseFechaLocal(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function formatearIsoLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

function hoyIsoLocal(): string {
  return formatearIsoLocal(new Date());
}

function haceDiasIsoLocal(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return formatearIsoLocal(fecha);
}

function formatearCorto(iso: string, incluirAnio = false): string {
  const f = parseFechaLocal(iso);
  const dia = f.getDate();
  const mes = MESES_CORTOS[f.getMonth()] ?? "";
  return incluirAnio ? `${dia} ${mes} ${f.getFullYear()}` : `${dia} ${mes}`;
}

function formatearRangoCompacto(desde: string, hasta: string): string {
  const d = parseFechaLocal(desde);
  const h = parseFechaLocal(hasta);
  const mismoAnio = d.getFullYear() === h.getFullYear();
  if (desde === hasta) {
    return formatearCorto(desde, true);
  }
  return `${formatearCorto(desde, !mismoAnio)} – ${formatearCorto(hasta, !mismoAnio)}`;
}

interface CeldaDia {
  iso: string;
  numero: number;
  enMesActual: boolean;
  esHoy: boolean;
}

function construirGrillaMes(anio: number, mes: number): CeldaDia[] {
  const primerDia = new Date(anio, mes, 1);
  const offsetLunes = (primerDia.getDay() + 6) % 7;
  const hoy = hoyIsoLocal();
  const celdas: CeldaDia[] = [];

  for (let i = 0; i < 42; i++) {
    const fecha = new Date(anio, mes, 1 - offsetLunes + i);
    const iso = formatearIsoLocal(fecha);
    celdas.push({
      iso,
      numero: fecha.getDate(),
      enMesActual: fecha.getMonth() === mes,
      esHoy: iso === hoy,
    });
  }

  return celdas;
}

/**
 * Selector de rango de fechas minimalista con calendario flotante dual-tone
 * y transición bidireccional suave de entrada y salida sin saltos de diseño.
 */
export function DateRangePicker({
  desde,
  hasta,
  activo,
  onChange,
  onActivate,
  onClear,
  fechasConActividad = [],
  className,
}: DateRangePickerProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const cierreTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paso, setPaso] = useState<"inicio" | "fin">("inicio");
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const [mesVista, setMesVista] = useState<{ anio: number; mes: number }>(() => {
    const ref = parseFechaLocal(hasta || hoyIsoLocal());
    return { anio: ref.getFullYear(), mes: ref.getMonth() };
  });

  const diasConActividad = useMemo(() => {
    const set = new Set<string>();
    for (const f of fechasConActividad) {
      if (!f) continue;
      const d = new Date(f);
      if (!Number.isNaN(d.getTime())) {
        set.add(formatearIsoLocal(d));
      } else if (/^\d{4}-\d{2}-\d{2}/.test(f)) {
        set.add(f.slice(0, 10));
      }
    }
    return set;
  }, [fechasConActividad]);

  const abrir = () => {
    if (cierreTimeoutRef.current !== null) {
      window.clearTimeout(cierreTimeoutRef.current);
      cierreTimeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const base = parseFechaLocal(hasta || desde || hoyIsoLocal());
    setMesVista({ anio: base.getFullYear(), mes: base.getMonth() });
    setPaso("inicio");
    setHoverIso(null);
    setAbierto(true);
    setMontado(true);
    onActivate();

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = window.requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  };

  const cerrar = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAbierto(false);
    setVisible(false);
    setHoverIso(null);
    if (cierreTimeoutRef.current !== null) {
      window.clearTimeout(cierreTimeoutRef.current);
    }
    cierreTimeoutRef.current = window.setTimeout(() => {
      setMontado(false);
      cierreTimeoutRef.current = null;
    }, 185);
  };

  useEffect(() => {
    return () => {
      if (cierreTimeoutRef.current !== null) {
        window.clearTimeout(cierreTimeoutRef.current);
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const alHacerClickFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        cerrar();
      }
    };

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar();
      }
    };

    document.addEventListener("mousedown", alHacerClickFuera);
    document.addEventListener("keydown", alPresionarTecla, true);
    return () => {
      document.removeEventListener("mousedown", alHacerClickFuera);
      document.removeEventListener("keydown", alPresionarTecla, true);
    };
  }, [abierto]);

  const navegarMes = (delta: number) => {
    setMesVista((prev) => {
      const siguiente = new Date(prev.anio, prev.mes + delta, 1);
      return {
        anio: siguiente.getFullYear(),
        mes: siguiente.getMonth(),
      };
    });
  };

  const alSeleccionarDia = (iso: string) => {
    if (paso === "inicio") {
      onChange({ desde: iso, hasta: iso });
      setPaso("fin");
      return;
    }

    const inicio = desde <= iso ? desde : iso;
    const fin = desde <= iso ? iso : desde;
    onChange({ desde: inicio, hasta: fin });
    setPaso("inicio");
    setHoverIso(null);
  };

  const aplicarPreset = (nuevoDesde: string, nuevoHasta: string) => {
    onChange({ desde: nuevoDesde, hasta: nuevoHasta });
    const ref = parseFechaLocal(nuevoHasta);
    setMesVista({ anio: ref.getFullYear(), mes: ref.getMonth() });
    setPaso("inicio");
    setHoverIso(null);
  };

  const rangoVisual = useMemo(() => {
    if (paso === "fin" && hoverIso) {
      return desde <= hoverIso
        ? { inicio: desde, fin: hoverIso }
        : { inicio: hoverIso, fin: desde };
    }
    return desde <= hasta
      ? { inicio: desde, fin: hasta }
      : { inicio: hasta, fin: desde };
  }, [paso, hoverIso, desde, hasta]);

  const conteoEnRango = useMemo(() => {
    if (!fechasConActividad.length) return 0;
    const inicioMs = parseFechaLocal(rangoVisual.inicio).getTime();
    const finDate = parseFechaLocal(rangoVisual.fin);
    finDate.setHours(23, 59, 59, 999);
    const finMs = finDate.getTime();

    let total = 0;
    for (const f of fechasConActividad) {
      const t = new Date(f).getTime();
      if (!Number.isNaN(t) && t >= inicioMs && t <= finMs) total++;
    }
    return total;
  }, [fechasConActividad, rangoVisual]);

  const celdas = useMemo(
    () => construirGrillaMes(mesVista.anio, mesVista.mes),
    [mesVista.anio, mesVista.mes],
  );

  const etiquetaMesActual = `${MESES_LARGOS[mesVista.mes] ?? ""} ${mesVista.anio}`;

  const presets = useMemo(() => {
    const hoy = new Date();
    const inicioMesActual = formatearIsoLocal(
      new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    );
    const inicioMesPasado = formatearIsoLocal(
      new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1),
    );
    const finMesPasado = formatearIsoLocal(
      new Date(hoy.getFullYear(), hoy.getMonth(), 0),
    );
    return [
      { label: "7 días", desde: haceDiasIsoLocal(6), hasta: hoyIsoLocal() },
      { label: "15 días", desde: haceDiasIsoLocal(14), hasta: hoyIsoLocal() },
      { label: "Este mes", desde: inicioMesActual, hasta: hoyIsoLocal() },
      { label: "Mes ant.", desde: inicioMesPasado, hasta: finMesPasado },
    ];
  }, []);

  return (
    <div ref={contenedorRef} className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "inline-flex h-[38px] items-center rounded-xl border p-1 transition-all duration-200 ease-out",
          activo || abierto
            ? "border-grayscale-4/80 bg-grayscale-2 shadow-2xs dark:border-grayscale-5/50 dark:bg-grayscale-2/90"
            : "border-transparent bg-grayscale-2 hover:bg-grayscale-2/90 dark:bg-grayscale-2/70",
        )}
      >
        <button
          type="button"
          onClick={() => (abierto ? cerrar() : abrir())}
          aria-expanded={abierto}
          aria-haspopup="dialog"
          className={cn(
            "inline-flex h-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-200",
            activo || abierto
              ? "bg-grayscale-1 text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.08)] dark:bg-grayscale-3"
              : "text-grayscale-10 hover:text-grayscale-12",
          )}
        >
          <CalendarBlankIcon
            size={14}
            weight={activo || abierto ? "fill" : "regular"}
            className={cn(
              "shrink-0 transition-colors duration-150",
              activo || abierto ? "text-grayscale-11" : "text-grayscale-9",
            )}
          />
          {activo ? (
            <span className="font-mono text-[12px] tracking-tight tabular-nums">
              {formatearRangoCompacto(desde, hasta)}
            </span>
          ) : (
            <span>Calendario</span>
          )}
          <CaretDownIcon
            size={11}
            weight="bold"
            className={cn(
              "ml-0.5 shrink-0 text-grayscale-9 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              abierto && "rotate-180 text-grayscale-12",
            )}
          />
        </button>

        {activo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (abierto) cerrar();
              onClear();
            }}
            aria-label="Restablecer filtro de calendario"
            title="Quitar filtro de fechas"
            className="ml-0.5 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-grayscale-9 transition-colors hover:bg-grayscale-3/80 hover:text-grayscale-12 dark:hover:bg-grayscale-4/50"
          >
            <XIcon size={11} weight="bold" />
          </button>
        )}
      </div>

      {montado && (
        <div
          role="dialog"
          aria-label="Selector de rango de fechas"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] left-0 z-40 w-[min(324px,calc(100vw-2rem))] origin-top-left will-change-[transform,opacity,filter]",
            visible
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0 transition-[transform,opacity,filter] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "pointer-events-none translate-y-1.5 scale-[0.96] opacity-0 blur-[2px] transition-[transform,opacity,filter] duration-[170ms] ease-[cubic-bezier(0.4,0,1,1)]",
          )}
        >
          <div className="rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-[0_18px_40px_-15px_rgba(24,24,22,0.18)] dark:border-grayscale-4/50 dark:bg-grayscale-3">
            <div className="rounded-[1rem] border border-grayscale-3/70 bg-white p-3.5 dark:border-grayscale-4/35 dark:bg-grayscale-2">
              {/* Indicador de extremos Desde / Hasta */}
              <div className="mb-3 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaso("inicio");
                    const d = parseFechaLocal(desde);
                    setMesVista({ anio: d.getFullYear(), mes: d.getMonth() });
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border px-2.5 py-1.5 text-left transition-all duration-150",
                    paso === "inicio"
                      ? "border-grayscale-12/35 bg-grayscale-2/75 dark:border-grayscale-9/45 dark:bg-grayscale-3/75"
                      : "border-grayscale-3/75 bg-transparent hover:border-grayscale-4 dark:border-grayscale-4/40",
                  )}
                >
                  <span className="block font-mono text-[9.5px] font-medium tracking-wider text-grayscale-8 uppercase">
                    Desde
                  </span>
                  <span className="mt-0.5 block font-mono text-[11.5px] font-semibold text-grayscale-12 tabular-nums">
                    {formatearCorto(rangoVisual.inicio, true)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaso("fin");
                    const h = parseFechaLocal(hasta);
                    setMesVista({ anio: h.getFullYear(), mes: h.getMonth() });
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border px-2.5 py-1.5 text-left transition-all duration-150",
                    paso === "fin"
                      ? "border-grayscale-12/35 bg-grayscale-2/75 dark:border-grayscale-9/45 dark:bg-grayscale-3/75"
                      : "border-grayscale-3/75 bg-transparent hover:border-grayscale-4 dark:border-grayscale-4/40",
                  )}
                >
                  <span className="block font-mono text-[9.5px] font-medium tracking-wider text-grayscale-8 uppercase">
                    Hasta
                  </span>
                  <span className="mt-0.5 block font-mono text-[11.5px] font-semibold text-grayscale-12 tabular-nums">
                    {formatearCorto(rangoVisual.fin, true)}
                  </span>
                </button>
              </div>

              {/* Navegación mensual */}
              <div className="mb-2.5 flex items-center justify-between px-0.5">
                <button
                  type="button"
                  onClick={() => navegarMes(-1)}
                  aria-label="Mes anterior"
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/75 text-grayscale-10 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12"
                >
                  <CaretLeftIcon size={12} weight="bold" />
                </button>

                <SlotNumber
                  value={etiquetaMesActual}
                  animateOnMount={false}
                  duration={210}
                  stagger={10}
                  bounce={0.12}
                  className="font-sans text-[12.5px] font-semibold capitalize text-grayscale-12"
                />

                <button
                  type="button"
                  onClick={() => navegarMes(1)}
                  aria-label="Mes siguiente"
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/75 text-grayscale-10 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12"
                >
                  <CaretRightIcon size={12} weight="bold" />
                </button>
              </div>

              {/* Cabecera días de la semana */}
              <div className="mb-1 grid grid-cols-7">
                {DIAS_SEMANA.map((dia) => (
                  <span
                    key={dia}
                    className="py-1 text-center font-mono text-[9.5px] font-medium tracking-wider text-grayscale-8"
                  >
                    {dia}
                  </span>
                ))}
              </div>

              {/* Grilla de días */}
              <div
                className="grid grid-cols-7 gap-y-0.5"
                onMouseLeave={() => setHoverIso(null)}
              >
                {celdas.map((celda, index) => {
                  const esInicio = celda.iso === rangoVisual.inicio;
                  const esFin = celda.iso === rangoVisual.fin;
                  const esExtremo = esInicio || esFin;
                  const enRango =
                    celda.iso > rangoVisual.inicio &&
                    celda.iso < rangoVisual.fin;
                  const col = index % 7;
                  const tieneActividad = diasConActividad.has(celda.iso);

                  return (
                    <div
                      key={celda.iso}
                      className={cn(
                        "relative flex items-center justify-center transition-colors duration-150",
                        enRango &&
                          "bg-grayscale-2/90 dark:bg-grayscale-4/45",
                        enRango && col === 0 && "rounded-l-lg",
                        enRango && col === 6 && "rounded-r-lg",
                        esInicio &&
                          rangoVisual.inicio !== rangoVisual.fin &&
                          "rounded-l-lg bg-grayscale-2/90 dark:bg-grayscale-4/45",
                        esFin &&
                          rangoVisual.inicio !== rangoVisual.fin &&
                          "rounded-r-lg bg-grayscale-2/90 dark:bg-grayscale-4/45",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => alSeleccionarDia(celda.iso)}
                        onMouseEnter={() => {
                          if (paso === "fin") setHoverIso(celda.iso);
                        }}
                        aria-label={celda.iso}
                        aria-pressed={esExtremo}
                        className={cn(
                          "relative flex h-8 w-full cursor-pointer flex-col items-center justify-center rounded-lg font-mono text-[11.5px] tabular-nums transition-all duration-150",
                          esExtremo
                            ? "z-10 bg-grayscale-12 font-semibold text-grayscale-1 shadow-2xs"
                            : enRango
                              ? "font-medium text-grayscale-12 hover:bg-grayscale-3/80 dark:hover:bg-grayscale-4/70"
                              : celda.enMesActual
                                ? "text-grayscale-11 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/70"
                                : "text-grayscale-7/60 hover:bg-grayscale-2/60 hover:text-grayscale-10 dark:hover:bg-grayscale-3/45",
                          celda.esHoy &&
                            !esExtremo &&
                            "ring-1 ring-inset ring-grayscale-5/80 font-semibold",
                        )}
                      >
                        <span>{celda.numero}</span>
                        {tieneActividad && (
                          <span
                            aria-hidden
                            className={cn(
                              "absolute bottom-1 h-1 w-1 rounded-full transition-colors",
                              esExtremo
                                ? "bg-grayscale-1/85"
                                : "bg-grayscale-8/80",
                            )}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Atajos rápidos */}
              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-grayscale-3/65 pt-2.5">
                {presets.map((preset) => {
                  const esActivo =
                    desde === preset.desde && hasta === preset.hasta;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => aplicarPreset(preset.desde, preset.hasta)}
                      className={cn(
                        "flex-1 cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-center text-[11px] font-medium transition-all duration-150",
                        esActivo
                          ? "bg-grayscale-12 text-grayscale-1"
                          : "bg-grayscale-2/75 text-grayscale-10 hover:bg-grayscale-3/70 hover:text-grayscale-12",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer del chasis */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-grayscale-9">
                <SlotNumber
                  value={conteoEnRango}
                  animateOnMount={false}
                  duration={200}
                  className="font-semibold text-grayscale-12"
                />
                <span>{conteoEnRango === 1 ? "solicitud" : "solicitudes"}</span>
              </span>

              <button
                type="button"
                onClick={cerrar}
                className="cursor-pointer rounded-lg bg-grayscale-12 px-2.5 py-1 text-[11px] font-medium text-grayscale-1 transition-opacity hover:opacity-90"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
