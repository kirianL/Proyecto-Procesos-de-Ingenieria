"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  HourglassIcon,
  TargetIcon,
  TrendUpIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { OPCIONES_PRIORIDAD } from "@/components/ui/PriorityPicker";
import { SlotNumber } from "@/components/ui/SlotNumber";
import {
  SegmentedControl,
  type Segmento,
} from "@/components/ui/SegmentedControl";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeVerIndicadores } from "@/lib/mantenimiento/auth";
import { METAS_ACADEMICAS_ODS12 } from "@/lib/mantenimiento/consultas";
import {
  getBandejaMantenimiento,
  getUsuarioActual,
  SOLICITUDES_MUESTRA,
} from "@/lib/mantenimiento/store";
import type { Estado, Solicitud, Usuario } from "@/lib/mantenimiento/types";

const META_HORAS = 48;

type Periodo = "TODO" | "7D" | "30D";

const PERIODOS: Segmento<Periodo>[] = [
  { id: "TODO", label: "Histórico" },
  { id: "7D", label: "Últimos 7 días" },
  { id: "30D", label: "Últimos 30 días" },
];

const DIAS_POR_PERIODO: Record<Periodo, number | null> = {
  TODO: null,
  "7D": 7,
  "30D": 30,
};

const DOT_ESTADO: Record<Estado, string> = {
  REGISTRADA: "bg-amber-8",
  EN_PROCESO: "bg-blue-8",
  CERRADA: "bg-grayscale-8",
};

export default function IndicadoresPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("TODO");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const refrescar = () => {
      setUsuario(getUsuarioActual());
      setSolicitudes(getBandejaMantenimiento());
    };
    refrescar();
    setMontado(true);
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  const autorizado = puedeVerIndicadores(usuario);

  useAtajos({ escape: () => router.push("/") }, autorizado);

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Resumen e indicadores"
        usuario={usuario}
        rolesPermitidos={["JEFATURA"]}
        motivo="El tablero de métricas operativas y tiempos de resolución está reservado para la jefatura de operaciones."
      />
    );
  }

  const cargando = solicitudes === null;
  const lista = solicitudes ?? SOLICITUDES_MUESTRA;

  const dias = DIAS_POR_PERIODO[periodo];
  const ahora = Date.now();
  const enPeriodo =
    dias === null
      ? lista
      : lista.filter(
          (solicitud) =>
            ahora - new Date(solicitud.creadaEn).getTime() <= dias * 86400000,
        );

  const totales = enPeriodo.length;
  const porEstado: Record<Estado, number> = {
    REGISTRADA: enPeriodo.filter((s) => s.estado === "REGISTRADA").length,
    EN_PROCESO: enPeriodo.filter((s) => s.estado === "EN_PROCESO").length,
    CERRADA: enPeriodo.filter((s) => s.estado === "CERRADA").length,
  };
  const abiertas = porEstado.REGISTRADA + porEstado.EN_PROCESO;
  const cerradas = porEstado.CERRADA;

  const cerradasConFecha = enPeriodo.filter(
    (s) => s.estado === "CERRADA" && s.cerradaEn,
  );
  const tiempoMedioHoras =
    cerradasConFecha.length > 0
      ? Number(
          (
            cerradasConFecha.reduce((total, solicitud) => {
              const inicio = new Date(solicitud.creadaEn).getTime();
              const fin = new Date(solicitud.cerradaEn as string).getTime();
              return total + Math.max(1, (fin - inicio) / 3600000);
            }, 0) / cerradasConFecha.length
          ).toFixed(1),
        )
      : null;

  const porcentajeCumplimiento =
    totales > 0 ? Math.round((cerradas / totales) * 100) : 0;

  const pctPorEstado = (estado: Estado) =>
    totales > 0 ? Math.round((porEstado[estado] / totales) * 100) : 0;

  const statsPeriodo = [
    {
      estado: "REGISTRADA" as Estado,
      label: "Pendientes",
      pct: pctPorEstado("REGISTRADA"),
      total: porEstado.REGISTRADA,
      dot: DOT_ESTADO.REGISTRADA,
    },
    {
      estado: "EN_PROCESO" as Estado,
      label: "En proceso",
      pct: pctPorEstado("EN_PROCESO"),
      total: porEstado.EN_PROCESO,
      dot: DOT_ESTADO.EN_PROCESO,
    },
    {
      estado: "CERRADA" as Estado,
      label: "Cerradas",
      pct: pctPorEstado("CERRADA"),
      total: porEstado.CERRADA,
      dot: DOT_ESTADO.CERRADA,
    },
  ];

  const porPrioridad = OPCIONES_PRIORIDAD.map((opcion) => ({
    ...opcion,
    total: enPeriodo.filter((s) => s.prioridad === opcion.id).length,
    pct: totales > 0 ? Math.round((enPeriodo.filter((s) => s.prioridad === opcion.id).length / totales) * 100) : 0,
  }));

  // Colores SVG por prioridad (alineados con los tokens Radix)
  const SVG_COLOR: Record<string, string> = {
    BAJA:    "var(--color-grayscale-7, #888)",
    MEDIA:   "var(--color-amber-8,   #d97706)",
    ALTA:    "var(--color-orange-8,  #ea580c)",
    URGENTE: "var(--color-red-8,     #dc2626)",
  };

  const dentroDeMeta =
    tiempoMedioHoras !== null && tiempoMedioHoras <= META_HORAS;
  const avanceMeta =
    tiempoMedioHoras !== null
      ? Math.min(100, Math.round((tiempoMedioHoras / META_HORAS) * 100))
      : 0;

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 md:gap-7">
      <div className="flex flex-col gap-4 md:gap-5">
        <PageHeader
          codigo="I08"
          eyebrow="Jefatura de operaciones"
          titulo="Resumen e indicadores"
          descripcion="Desempeño de la infraestructura, tiempos de ciclo y tasa de resolución del período."
          acciones={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-grayscale-2 px-2.5 py-1 text-[11px] text-grayscale-10 dark:bg-grayscale-2/70">
              <EyeIcon size={12} weight="bold" />
              Solo lectura
            </span>
          }
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SegmentedControl
            items={PERIODOS}
            value={periodo}
            onChange={setPeriodo}
            ariaLabel="Filtrar indicadores por período"
          />
          <p className="text-[11.5px] leading-snug text-grayscale-9 md:max-w-[46%] md:text-right inline-flex items-center gap-1 md:justify-end">
            <SlotNumber value={totales} className="font-semibold text-grayscale-11" />
            <span>
              {totales === 1
                ? "solicitud considerada"
                : "solicitudes consideradas"}{" "}
              en{" "}
              {periodo === "TODO"
                ? "todo el histórico"
                : periodo === "7D"
                  ? "los últimos 7 días"
                  : "los últimos 30 días"}
            </span>
          </p>
        </div>

        <SkeletonContent
          id="indicadores-contenido"
          loading={cargando}
          minLoadMs={300}
          label="Cargando indicadores"
        >
          <div className="flex flex-col gap-4 md:gap-5">
            <section className="stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4 md:gap-4">
              <MetricCard
                label="Total"
                valor={totales}
                unidad="Solicitudes"
                detalle="Consolidadas en el período"
                dot="bg-grayscale-8"
                icon={TrendUpIcon}
                delay={0}
              />
              <MetricCard
                label="Pendientes"
                valor={porEstado.REGISTRADA}
                detalle="Sin diagnóstico asignado"
                dot="bg-amber-8"
                tono="amber"
                total={totales}
                icon={HourglassIcon}
                delay={1}
              />
              <MetricCard
                label="En atención"
                valor={porEstado.EN_PROCESO}
                detalle="Técnico en labores"
                dot="bg-blue-8"
                tono="blue"
                total={totales}
                icon={ClockIcon}
                delay={2}
              />
              <MetricCard
                label="Cerradas"
                valor={cerradas}
                detalle={`${porcentajeCumplimiento}% de efectividad`}
                dot="bg-green-8"
                tono="emerald"
                total={totales}
                icon={CheckCircleIcon}
                delay={3}
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-4">
              {/* MTTR */}
              <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
                <div className="flex flex-1 flex-col justify-between gap-4 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        skullet-block=""
                        className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                      >
                        <ClockIcon size={13} />
                      </span>
                      <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Tiempo medio de resolución
                      </h2>
                    </div>

                    <div className="flex items-baseline gap-2">
                      {tiempoMedioHoras === null ? (
                        <span className="num text-[32px] font-bold leading-none tracking-[-0.03em] text-grayscale-12 font-mono">
                          —
                        </span>
                      ) : (
                        <SlotNumber
                          value={tiempoMedioHoras}
                          decimals={1}
                          className="text-[32px] font-bold leading-none tracking-[-0.03em] text-grayscale-12 font-mono"
                        />
                      )}
                      <span className="text-[11.5px] text-grayscale-9">
                        {tiempoMedioHoras === null
                          ? "sin cierres en el período"
                          : "horas promedio"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-grayscale-9">
                      <span className="flex items-center gap-1.5">
                        <TargetIcon size={13} />
                        Meta corporativa · {META_HORAS} h
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          tiempoMedioHoras === null
                            ? "text-grayscale-9"
                            : dentroDeMeta
                              ? "text-grayscale-11"
                              : "text-grayscale-11",
                        )}
                      >
                        {tiempoMedioHoras === null
                          ? "Sin datos"
                          : dentroDeMeta
                            ? "En meta"
                            : "Fuera de meta"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-grayscale-3">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700 ease-out",
                          dentroDeMeta ? "bg-emerald-500" : "bg-amber-500",
                        )}
                        style={{ width: montado ? `${avanceMeta}%` : "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-grayscale-10">
                    <TargetIcon size={12} className="text-grayscale-8" />
                    Tasa de cumplimiento
                  </span>
                  <SlotNumber
                    value={porcentajeCumplimiento}
                    suffix="%"
                    className="font-bold text-grayscale-12 font-mono text-[12px]"
                  />
                </div>
              </section>

              {/* Distribución por estado */}
              <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
                <div className="flex flex-1 flex-col justify-between gap-3.5 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          skullet-block=""
                          className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                        >
                          <TrendUpIcon size={13} />
                        </span>
                        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                          Distribución por estado
                        </h2>
                      </div>
                      <Link
                        href="/mantenimiento"
                        className="group inline-flex items-center gap-1 text-[11px] font-medium text-grayscale-10 transition-colors hover:text-grayscale-12"
                      >
                        Bandeja
                        <ArrowRightIcon
                          size={11}
                          className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>

                    <div className="flex h-3.5 w-full gap-1 overflow-hidden">
                      <div
                        className="rounded-l-md bg-amber-500/70 transition-[width] duration-700 ease-out"
                        style={{
                          width: montado ? `${pctPorEstado("REGISTRADA")}%` : "0%",
                        }}
                        title={`Pendientes: ${pctPorEstado("REGISTRADA")}%`}
                      />
                      <div
                        className="bg-blue-500/70 transition-[width] duration-700 ease-out"
                        style={{
                          width: montado ? `${pctPorEstado("EN_PROCESO")}%` : "0%",
                        }}
                        title={`En proceso: ${pctPorEstado("EN_PROCESO")}%`}
                      />
                      <div
                        className="rounded-r-md bg-grayscale-8 transition-[width] duration-700 ease-out"
                        style={{
                          width: montado ? `${pctPorEstado("CERRADA")}%` : "0%",
                        }}
                        title={`Cerradas: ${pctPorEstado("CERRADA")}%`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {statsPeriodo.map((fila) => (
                      <Link
                        key={fila.estado}
                        href={`/mantenimiento?estado=${fila.estado}`}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-[11.5px] transition-colors duration-150 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/60"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-grayscale-10">
                          <span
                            className={cn("size-1.5 shrink-0 rounded-full", fila.dot)}
                          />
                          <span className="truncate">{fila.label}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-grayscale-10">
                          <SlotNumber
                            value={fila.total}
                            className="font-mono text-[11.5px] text-grayscale-11 font-medium"
                          />
                          <span>·</span>
                          <SlotNumber
                            value={fila.pct}
                            suffix="%"
                            className="font-mono text-[11.5px] text-grayscale-9 font-medium"
                          />
                          <ArrowRightIcon
                            size={10}
                            className="text-grayscale-7 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-10"
                          />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] text-grayscale-9">
                  <SlotNumber
                    value={abiertas}
                    className="font-bold text-grayscale-12 font-mono text-[11.5px]"
                  />
                  <span>requerimientos abiertos en este momento.</span>
                </div>
              </section>
            </div>

            {/* ── Distribución por prioridad ── */}
            <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
              <div className="flex-1 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2">

                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      skullet-block=""
                      className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                    >
                      <WarningIcon size={13} />
                    </span>
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      Carga por prioridad
                    </h2>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-grayscale-9">
                    <SlotNumber value={totales} className="font-semibold text-grayscale-11 text-[11px]" />
                    <span>solicitudes en el período</span>
                  </span>
                </div>

                {/* Layout: donut izquierda + lista derecha */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">

                  {/* Donut SVG */}
                  <div className="relative mx-auto shrink-0 lg:mx-1" style={{ width: 124, height: 124 }}>
                    <svg width="124" height="124" viewBox="0 0 124 124" fill="none" className="rotate-[-90deg] rounded-full">
                      {(() => {
                        const r = 47;
                        const stroke = 13;
                        const circ = 2 * Math.PI * r;
                        const gap = 2; // px de espacio entre arcos

                        // Calculamos los arcos acumulados
                        type Arc = { id: string; pct: number; total: number };
                        const arcs: Arc[] = porPrioridad
                          .filter((p) => p.total > 0)
                          .map((p) => ({
                            id: p.id,
                            pct: p.pct,
                            total: p.total,
                          }));

                        if (arcs.length === 0) {
                          // Anillo vacío
                          return (
                            <circle
                              cx="62" cy="62" r={r}
                              stroke="var(--color-grayscale-3, #e5e5e5)"
                              strokeWidth={stroke}
                              fill="none"
                            />
                          );
                        }

                        let offset = 0;
                        return arcs.map((arc) => {
                          const dash = Math.max(0, (arc.pct / 100) * circ - gap);
                          const spacer = circ - dash;
                          const el = (
                            <circle
                              key={arc.id}
                              cx="62" cy="62" r={r}
                              stroke={SVG_COLOR[arc.id]}
                              strokeWidth={stroke}
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${spacer}`}
                              strokeDashoffset={-offset}
                              fill="none"
                              className="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
                            />
                          );
                          offset += (arc.pct / 100) * circ;
                          return el;
                        });
                      })()}
                      {/* Pista de fondo */}
                      <circle
                        cx="62" cy="62" r={47}
                        stroke="var(--color-grayscale-3, #e5e5e5)"
                        strokeWidth={13}
                        fill="none"
                        className="opacity-30"
                      />
                    </svg>

                    {/* Centro: número total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 pointer-events-none">
                      <SlotNumber
                        value={totales}
                        className="text-[22px] font-bold leading-none tracking-tight text-grayscale-12 font-mono"
                      />
                      <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-widest text-grayscale-8">
                        Total
                      </span>
                    </div>
                  </div>

                  {/* Lista de prioridades */}
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 min-w-0">
                    {porPrioridad.map((fila) => {
                      const urgente = fila.id === "URGENTE";
                      return (
                        <Link
                          key={fila.id}
                          href={`/mantenimiento?prioridad=${fila.id}`}
                          className="group flex items-center justify-between gap-2.5 rounded-xl border border-grayscale-3/70 bg-grayscale-1/60 px-3.5 py-2.5 transition-all duration-150 hover:border-grayscale-4 hover:bg-grayscale-2/70 dark:border-grayscale-4/40 dark:bg-grayscale-3/30 dark:hover:bg-grayscale-3/60"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {/* Rank / nivel glifo */}
                            <span
                              aria-hidden
                              skullet-block=""
                              className="flex shrink-0 items-end gap-[2px] h-3.5"
                            >
                              {[1,2,3,4].map((n) => (
                                <span
                                  key={n}
                                  className={cn(
                                    "w-[2.5px] rounded-sm transition-colors duration-300",
                                    n <= fila.nivel
                                      ? fila.dot
                                      : "bg-grayscale-3/80 dark:bg-grayscale-4/50"
                                  )}
                                  style={{ height: 3 + n * 2.5 }}
                                />
                              ))}
                            </span>

                            {/* Label + hint */}
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className={cn(
                                "text-[12px] font-semibold leading-none",
                                urgente ? "text-red-11 dark:text-red-9" : "text-grayscale-12"
                              )}>
                                {fila.label}
                              </span>
                              <span className="truncate text-[10.5px] text-grayscale-9">
                                {fila.hint}
                              </span>
                            </div>
                          </div>

                          {/* Barra waffle + número */}
                          <div className="flex shrink-0 items-center gap-2.5">
                            {/* Mini barra segmentada en 10 slots */}
                            <span
                              skullet-block=""
                              className="hidden sm:flex items-center gap-[2px]"
                              aria-hidden
                            >
                              {Array.from({ length: 10 }).map((_, i) => {
                                const llena = i < Math.round(fila.pct / 10);
                                return (
                                  <span
                                    key={i}
                                    className={cn(
                                      "h-[5px] w-[4px] rounded-[1.5px] transition-colors duration-500",
                                      llena ? fila.dot : "bg-grayscale-3/70 dark:bg-grayscale-4/40"
                                    )}
                                  />
                                );
                              })}
                            </span>

                            <span className="flex flex-col items-end leading-none gap-0.5">
                              <SlotNumber
                                value={fila.total}
                                className="text-[13px] font-bold text-grayscale-12 font-mono"
                              />
                              <SlotNumber
                                value={fila.pct}
                                suffix="%"
                                className="text-[9.5px] text-grayscale-8 font-mono"
                              />
                            </span>

                            <ArrowRightIcon
                              size={10}
                              className="text-grayscale-6 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-10"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 text-[11px] text-grayscale-9">
                Distribución de carga de trabajo por severidad
              </div>
            </section>

            {/* Metas operativas y de sostenibilidad */}
            <section className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TargetIcon size={15} weight="duotone" className="text-sand-9/80" />
                    <h2 className="text-[13px] font-semibold text-grayscale-12">
                      Metas operativas y de eficiencia del servicio
                    </h2>
                  </div>
                  <span className="rounded-md bg-grayscale-2 px-2 py-0.5 font-mono text-[10px] font-medium text-grayscale-10">
                    Objetivos del área
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-[12px]">
                  <div className="surface-soft rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-grayscale-9 block">
                      Tiempo medio de atención
                    </span>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-[13.5px] font-bold text-grayscale-12">
                        Meta: ≤ {METAS_ACADEMICAS_ODS12.tiempoMedio.metaHoras} h
                      </span>
                      <span className="text-[11px] text-grayscale-9">
                        (Anterior: {METAS_ACADEMICAS_ODS12.tiempoMedio.baseHoras} h)
                      </span>
                    </div>
                  </div>

                  <div className="surface-soft rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-grayscale-9 block">
                      Satisfacción de usuarios internos
                    </span>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-[13.5px] font-bold text-grayscale-12">
                        Meta: ≥ {METAS_ACADEMICAS_ODS12.satisfaccion.metaPorcentaje}%
                      </span>
                      <span className="text-[11px] text-grayscale-9">
                        (Anterior: {METAS_ACADEMICAS_ODS12.satisfaccion.basePorcentaje}%)
                      </span>
                    </div>
                  </div>

                  <div className="surface-soft rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-grayscale-9 block">
                      Formularios físicos en papel
                    </span>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-[13.5px] font-bold text-grayscale-12">
                        Meta: ≤ {METAS_ACADEMICAS_ODS12.formulariosFisicosMes.meta}/mes
                      </span>
                      <span className="text-[11px] text-grayscale-9">
                        (Anterior: {METAS_ACADEMICAS_ODS12.formulariosFisicosMes.base}/mes)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {porcentajeCumplimiento < 50 && totales > 0 && (
              <div className="surface-soft flex items-start gap-2.5 px-4 py-3.5 text-[12px] text-grayscale-10">
                <WarningIcon
                  size={15}
                  weight="fill"
                  className="mt-px shrink-0 text-amber-600/80 dark:text-amber-400/70"
                />
                <p>
                  Menos de la mitad de las solicitudes se están cerrando en este
                  período. Conviene revisar la asignación de la cola técnica.
                </p>
              </div>
            )}
          </div>
        </SkeletonContent>
      </div>

      <BottomBar
        statusInfo={{
          title: `${totales} solicitudes consolidadas · ${
            periodo === "TODO"
              ? "histórico"
              : periodo === "7D"
                ? "7 días"
                : "30 días"
          }`,
          subtitle: `Supervisión de ${nombreLimpio(usuario.nombre)} · ${usuario.cargo}`,
        }}
        primaryLabel="Ver bandeja general"
        primaryHref="/mantenimiento"
        shortcuts={[{ key: "Esc", label: "Volver al panel" }]}
      />
    </div>
  );
}
