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

// Curvas al estilo de popovers nativos (Radix / Linear / macOS):
// entrada con ease-out pronunciado y salida más corta con ease-in suave.
const CURVA_ENTRADA = "cubic-bezier(0.23, 1, 0.32, 1)";
const CURVA_SALIDA = "cubic-bezier(0.4, 0, 0.7, 0.2)";
const DURACION_ENTRADA = 280;
const DURACION_SALIDA = 150;

// Pre-cache de fechas parseadas a milisegundos para evitar recalcular
// `parseFechaLocal` y `getTime()` en cada evento de hover o selección.
const parseFechaLocalMs = (iso: string): number => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getTime();
};

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
  const reducirMovimiento = useRef(false);

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
    for (let i = 0; i < fechasConActividad.length; i++) {
      const f = fechasConActividad[i];
      if (!f) continue;
      if (f.length >= 10 && f[4] === "-" && f[7] === "-") {
        set.add(f.slice(0, 10));
      } else {
        const d = new Date(f);
        if (!Number.isNaN(d.getTime())) {
          set.add(formatearIsoLocal(d));
        }
      }
    }
    return set;
  }, [fechasConActividad]);

  const timestampsActividad = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < fechasConActividad.length; i++) {
      const f = fechasConActividad[i];
      if (!f) continue;
      const t = new Date(f).getTime();
      if (!Number.isNaN(t)) arr.push(t);
    }
    return arr;
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
    reducirMovimiento.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setMesVista({ anio: base.getFullYear(), mes: base.getMonth() });
    setPaso("inicio");
    setHoverIso(null);
    setAbierto(true);
    onActivate();

    // Si se reabre a mitad del cierre, la transición se invierte
    // desde su posición actual sin saltos.
    if (montado) {
      setVisible(true);
      return;
    }

    setMontado(true);
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
    // Respaldo por si `transitionend` no se dispara (pestaña oculta, etc.).
    cierreTimeoutRef.current = window.setTimeout(() => {
      setMontado(false);
      cierreTimeoutRef.current = null;
    }, DURACION_SALIDA + 80);
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
    if (!timestampsActividad.length) return 0;
    const inicioMs = parseFechaLocalMs(rangoVisual.inicio);
    const finMs = parseFechaLocalMs(rangoVisual.fin) + 86399999;

    let total = 0;
    for (let i = 0; i < timestampsActividad.length; i++) {
      const t = timestampsActividad[i];
      if (t >= inicioMs && t <= finMs) total++;
    }
    return total;
  }, [timestampsActividad, rangoVisual.inicio, rangoVisual.fin]);

  const celdas = useMemo(
    () => construirGrillaMes(mesVista.anio, mesVista.mes),
    [mesVista.anio, mesVista.mes],
  );

  const etiquetaMesActual = `${MESES_LARGOS[mesVista.mes] ?? ""} ${mesVista.anio}`;

  return (
    <div ref={contenedorRef} className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "inline-flex h-[38px] items-center rounded-lg border p-1 transition-[border-color,background-color,box-shadow] duration-150 ease-out",
          activo || abierto
            ? "border-grayscale-4/80 bg-grayscale-2 shadow-2xs dark:border-white/[0.22] dark:bg-[#181816]"
            : "border-transparent bg-grayscale-2 hover:bg-grayscale-2/90 dark:border-white/[0.09] dark:bg-[#161614] dark:hover:border-white/[0.15]",
        )}
      >
        <button
          type="button"
          onClick={() => (abierto ? cerrar() : abrir())}
          aria-expanded={abierto}
          aria-haspopup="dialog"
          className={cn(
            "inline-flex h-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 active:scale-[0.98]",
            activo || abierto
              ? "bg-grayscale-1 text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.08)] dark:border dark:border-white/[0.1] dark:bg-[#252522]"
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
              "ml-0.5 shrink-0 text-grayscale-9 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
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
          onTransitionEnd={(e) => {
            if (
              e.target === e.currentTarget &&
              e.propertyName === "opacity" &&
              !visible
            ) {
              if (cierreTimeoutRef.current !== null) {
                window.clearTimeout(cierreTimeoutRef.current);
                cierreTimeoutRef.current = null;
              }
              setMontado(false);
            }
          }}
          className={cn(
            "absolute top-[calc(100%+0.5rem)] left-0 z-40 w-[min(324px,calc(100vw-2rem))] origin-[18px_-6px]",
            visible ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translate3d(0,0,0) scale(1)"
              : `translate3d(0,${reducirMovimiento.current ? 0 : -6}px,0) scale(${reducirMovimiento.current ? 1 : 0.96})`,
            transition: visible
              ? `transform ${DURACION_ENTRADA}ms ${CURVA_ENTRADA}, opacity 180ms ${CURVA_ENTRADA}`
              : `transform ${DURACION_SALIDA}ms ${CURVA_SALIDA}, opacity ${DURACION_SALIDA}ms ${CURVA_SALIDA}`,
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-[0_18px_40px_-15px_rgba(24,24,22,0.18)] dark:border-white/[0.15] dark:bg-[#1a1a18] dark:shadow-[0_24px_48px_-14px_rgba(0,0,0,0.82)]">
            <div
              className="rounded-[1rem] border border-grayscale-3/70 bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#121211]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible || reducirMovimiento.current
                  ? "translate3d(0,0,0)"
                  : "translate3d(0,-2px,0)",
                transition: visible
                  ? `opacity 220ms ${CURVA_ENTRADA} 50ms, transform ${DURACION_ENTRADA}ms ${CURVA_ENTRADA} 30ms`
                  : `opacity 90ms ${CURVA_SALIDA}, transform 90ms ${CURVA_SALIDA}`,
              }}
            >
              {/* Indicador de extremos Desde y Hasta minimalista y continuo */}
              <div className="mb-3 flex items-center justify-between rounded-xl bg-grayscale-2/70 p-1 dark:border dark:border-white/[0.06] dark:bg-[#191917]">
                <button
                  type="button"
                  onClick={() => {
                    setPaso("inicio");
                    const d = parseFechaLocal(desde);
                    setMesVista({ anio: d.getFullYear(), mes: d.getMonth() });
                  }}
                  className={cn(
                    "flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-left transition-[background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                    paso === "inicio"
                      ? "bg-white text-grayscale-12 shadow-2xs dark:border dark:border-white/[0.1] dark:bg-[#252522]"
                      : "text-grayscale-10 hover:text-grayscale-12",
                  )}
                >
                  <span className="block font-mono text-[9px] font-medium tracking-wider text-grayscale-8 uppercase">
                    Desde
                  </span>
                  <span className="mt-0.5 block font-mono text-[11.5px] font-semibold text-grayscale-12 tabular-nums">
                    {formatearCorto(rangoVisual.inicio, true)}
                  </span>
                </button>

                <div className="px-1 text-grayscale-7">
                  <span className="text-[11px]">→</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPaso("fin");
                    const h = parseFechaLocal(hasta);
                    setMesVista({ anio: h.getFullYear(), mes: h.getMonth() });
                  }}
                  className={cn(
                    "flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-left transition-[background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                    paso === "fin"
                      ? "bg-white text-grayscale-12 shadow-2xs dark:border dark:border-white/[0.1] dark:bg-[#252522]"
                      : "text-grayscale-10 hover:text-grayscale-12",
                  )}
                >
                  <span className="block font-mono text-[9px] font-medium tracking-wider text-grayscale-8 uppercase">
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
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/75 text-grayscale-10 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:border-white/[0.1] dark:hover:border-white/[0.2] dark:hover:bg-white/[0.06]"
                >
                  <CaretLeftIcon size={12} weight="bold" />
                </button>

                <span className="font-sans text-[12.5px] font-semibold capitalize text-grayscale-12 select-none">
                  {etiquetaMesActual}
                </span>

                <button
                  type="button"
                  onClick={() => navegarMes(1)}
                  aria-label="Mes siguiente"
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/75 text-grayscale-10 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:border-white/[0.1] dark:hover:border-white/[0.2] dark:hover:bg-white/[0.06]"
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
                onMouseLeave={() => {
                  if (hoverIso) setHoverIso(null);
                }}
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
                        "relative flex items-center justify-center",
                        enRango &&
                          "bg-grayscale-2/90 dark:bg-white/[0.08]",
                        enRango && col === 0 && "rounded-l-lg",
                        enRango && col === 6 && "rounded-r-lg",
                        esInicio &&
                          rangoVisual.inicio !== rangoVisual.fin &&
                          "rounded-l-lg bg-grayscale-2/90 dark:bg-white/[0.08]",
                        esFin &&
                          rangoVisual.inicio !== rangoVisual.fin &&
                          "rounded-r-lg bg-grayscale-2/90 dark:bg-white/[0.08]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => alSeleccionarDia(celda.iso)}
                        onMouseEnter={() => {
                          if (paso === "fin" && hoverIso !== celda.iso) {
                            setHoverIso(celda.iso);
                          }
                        }}
                        aria-label={celda.iso}
                        aria-pressed={esExtremo}
                        className={cn(
                          "relative flex h-8 w-full cursor-pointer flex-col items-center justify-center rounded-lg font-mono text-[11.5px] tabular-nums",
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
                              "absolute bottom-1 h-1 w-1 rounded-full",
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
