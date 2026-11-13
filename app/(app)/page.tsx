"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  HourglassIcon,
  PlusIcon,
  SparkleIcon,
  WarningCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Button from "@/components/public/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { SolicitudCard } from "@/components/ui/SolicitudCard";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { calcularEstadoSla } from "@/lib/mantenimiento/sla";
import {
  getBandejaMantenimiento,
  getIndicadores,
  getSolicitudesPorCreador,
  getUsuarioActual,
  INDICADORES_MUESTRA,
  SOLICITUDES_MUESTRA,
} from "@/lib/mantenimiento/store";
import type {
  IndicadoresResumen,
  Solicitud,
  Usuario,
} from "@/lib/mantenimiento/types";

type FiltroBandeja = "TODAS" | "ABIERTAS" | "CERRADAS";

export default function Home() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [indicadores, setIndicadores] = useState<IndicadoresResumen | null>(() =>
    getIndicadores(),
  );
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => {
    const actual = getUsuarioActual();
    return actual.rol === "EMPLEADO"
      ? getSolicitudesPorCreador(actual.id)
      : getBandejaMantenimiento();
  });
  const [filtroBandeja, setFiltroBandeja] = useState<FiltroBandeja>("TODAS");

  useEffect(() => {
    const refrescar = () => {
      const actual = getUsuarioActual();
      setUsuario(actual);
      setIndicadores(getIndicadores());
      const lista =
        actual.rol === "EMPLEADO"
          ? getSolicitudesPorCreador(actual.id)
          : getBandejaMantenimiento();
      setSolicitudes(lista);
    };

    refrescar();
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  useAtajos({ n: () => router.push("/solicitudes/nueva") });

  // Nombre de pila natural sin prefijos profesionales tipo "Ing. / Arq."
  const nombrePila = useMemo(() => {
    const limpio = nombreLimpio(usuario.nombre);
    const partes = limpio.split(" ");
    if (partes[0]?.includes(".") && partes[1]) return partes[1];
    return partes[0] ?? limpio;
  }, [usuario.nombre]);

  const kpis = indicadores ?? INDICADORES_MUESTRA;

  // Filtrado de la lista en el panel de actividad
  const listaFiltrada = useMemo(() => {
    if (filtroBandeja === "ABIERTAS") {
      return solicitudes.filter((s) => s.estado !== "CERRADA");
    }
    if (filtroBandeja === "CERRADAS") {
      return solicitudes.filter((s) => s.estado === "CERRADA");
    }
    return solicitudes;
  }, [solicitudes, filtroBandeja]);

  // Casos de atención inmediata (ordenados por criticidad de SLA y severidad)
  const itemsCriticos = useMemo(() => {
    return solicitudes
      .filter((s) => s.estado !== "CERRADA")
      .map((s) => ({ solicitud: s, sla: calcularEstadoSla(s) }))
      .sort((a, b) => {
        const pesoSla = {
          EXCEDIDO: 4,
          POR_VENCER: 3,
          EN_MARGEN: 1,
          CUMPLIDO: 0,
          INCUMPLIDO: 0,
        };
        const difSla = pesoSla[b.sla.estadoSla] - pesoSla[a.sla.estadoSla];
        if (difSla !== 0) return difSla;
        const pesoPrio = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };
        return pesoPrio[b.solicitud.prioridad] - pesoPrio[a.solicitud.prioridad];
      })
      .slice(0, 3);
  }, [solicitudes]);

  const abiertasTotal = useMemo(
    () => solicitudes.filter((s) => s.estado !== "CERRADA").length,
    [solicitudes],
  );

  const cerradasTotal = useMemo(
    () => solicitudes.filter((s) => s.estado === "CERRADA").length,
    [solicitudes],
  );

  const tabsBandeja = [
    { id: "TODAS" as FiltroBandeja, label: "Todas", count: solicitudes.length },
    { id: "ABIERTAS" as FiltroBandeja, label: "En curso", count: abiertasTotal },
    { id: "CERRADAS" as FiltroBandeja, label: "Resueltas", count: cerradasTotal },
  ];

  const desglosePrioridad = useMemo(() => {
    const abiertas = solicitudes.filter((s) => s.estado !== "CERRADA");
    const total = abiertas.length;
    const contar = (p: Solicitud["prioridad"]) =>
      abiertas.filter((s) => s.prioridad === p).length;

    return [
      { key: "URGENTE" as const, label: "Urgente", count: contar("URGENTE"), bar: "bg-red-8", dot: "bg-red-8" },
      { key: "ALTA" as const, label: "Alta", count: contar("ALTA"), bar: "bg-amber-8", dot: "bg-amber-8" },
      { key: "MEDIA" as const, label: "Media", count: contar("MEDIA"), bar: "bg-blue-8", dot: "bg-blue-8" },
      { key: "BAJA" as const, label: "Baja", count: contar("BAJA"), bar: "bg-grayscale-7", dot: "bg-grayscale-7" },
    ].map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [solicitudes]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* ── 1. CABECERA OPERATIVA CON ESCALA NATIVA (PageHeader) ── */}
      <PageHeader
        eyebrow={
          usuario.rol === "EMPLEADO"
            ? "Portal de Solicitante"
            : usuario.rol === "TECNICO"
              ? "Consola Técnica"
              : "Supervisión Operativa"
        }
        titulo={`Hola, ${nombrePila}`}
        acciones={
          <div className="flex items-center gap-2">
            {usuario.rol === "EMPLEADO" ? (
              <Button href="/solicitudes/nueva" variant="primary">
                <PlusIcon size={14} weight="bold" />
                <span>Nueva solicitud</span>
              </Button>
            ) : (
              <>
                <Button href="/solicitudes/nueva" variant="secondary" className="hidden sm:inline-flex">
                  <PlusIcon size={14} weight="bold" />
                  <span>Registrar</span>
                </Button>
                <Button
                  href={usuario.rol === "JEFATURA" ? "/indicadores" : "/mantenimiento"}
                  variant="primary"
                >
                  <WrenchIcon size={14} weight="bold" />
                  <span>{usuario.rol === "JEFATURA" ? "Ver indicadores" : "Bandeja técnica"}</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* ── 2. METRICAS CLAVE / ESTADO DE SITUACION ── */}
      <SkeletonContent id="home-kpis" loading={false}>
        <section className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total"
            valor={kpis.totales}
            unidad="Solicitudes"
            detalle="En el sistema"
            dot="bg-grayscale-8"
            icon={ClipboardTextIcon}
            delay={0}
          />
          <MetricCard
            label="Pendientes"
            valor={kpis.porEstado.REGISTRADA}
            detalle="Sin iniciar"
            dot="bg-amber-8"
            tono="amber"
            total={kpis.totales}
            icon={HourglassIcon}
            delay={1}
          />
          <MetricCard
            label="En atención"
            valor={kpis.porEstado.EN_PROCESO}
            detalle="Técnico laborando"
            dot="bg-blue-8"
            tono="blue"
            total={kpis.totales}
            icon={WrenchIcon}
            delay={2}
          />
          <MetricCard
            label="Cerradas"
            valor={kpis.porEstado.CERRADA}
            detalle={`${kpis.porcentajeCumplimiento}% efectividad`}
            dot="bg-green-8"
            tono="emerald"
            total={kpis.totales}
            icon={CheckCircleIcon}
            delay={3}
          />
        </section>
      </SkeletonContent>

      {/* ── 3. CUERPO PRINCIPAL ASIMETRICO: ACTIVIDAD + RADAR OPERATIVO ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)]">
        {/* COLUMNA IZQUIERDA: Flujo con filtro segmentado reactivo */}
        <section className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              items={tabsBandeja}
              value={filtroBandeja}
              onChange={setFiltroBandeja}
              ariaLabel="Filtrar actividad por estado"
            />

            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[10.5px] text-grayscale-9 sm:inline">
                {Math.min(4, listaFiltrada.length)} de {listaFiltrada.length}
              </span>
              <Link
                href={usuario.rol === "EMPLEADO" ? "/mis-solicitudes" : "/mantenimiento"}
                className="group inline-flex items-center gap-1 font-mono text-[11.5px] font-medium text-grayscale-10 transition-colors hover:text-grayscale-12"
              >
                <span>Ver todas</span>
                <ArrowRightIcon
                  size={11}
                  className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          {listaFiltrada.length === 0 ? (
            <EmptyState
              icon={ClipboardTextIcon}
              titulo="No hay solicitudes en esta vista"
              descripcion="Actualmente no existen registros bajo el filtro seleccionado."
            />
          ) : (
            <div className="stagger space-y-3">
              {listaFiltrada.slice(0, 4).map((solicitud, index) => (
                <div
                  key={solicitud.id}
                  style={{ "--stagger": index } as CSSProperties}
                >
                  <SolicitudCard
                    solicitud={solicitud}
                    icon={
                      solicitud.estado === "CERRADA"
                        ? CheckCircleIcon
                        : WrenchIcon
                    }
                    href={`/solicitudes/${solicitud.id}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: Radar de Atención Inmediata & SLA */}
        <aside className="flex flex-col gap-4 min-w-0">
          {/* Card 1: Foco Operativo y Casos en Riesgo de SLA */}
          <div className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
              <div className="flex items-center justify-between gap-2 border-b border-grayscale-3/70 pb-3 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                    <WarningCircleIcon size={14} weight="bold" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-grayscale-12">
                    Prioridad y SLA Crítico
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium text-grayscale-9">
                  <span className="rounded-md bg-grayscale-3/80 px-1.5 py-0.5 text-grayscale-11 tabular-nums dark:bg-white/[0.08]">
                    {itemsCriticos.length}
                  </span>
                  En riesgo
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {itemsCriticos.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-grayscale-9">
                    No hay incidencias urgentes ni vencidas.
                  </p>
                ) : (
                  itemsCriticos.map(({ solicitud, sla }) => {
                    const colorSegmento =
                      sla.estadoSla === "EXCEDIDO"
                        ? "bg-red-8"
                        : sla.estadoSla === "POR_VENCER"
                          ? "bg-amber-8"
                          : "bg-green-8";

                    return (
                      <Link
                        key={solicitud.id}
                        href={`/solicitudes/${solicitud.id}`}
                        className="group flex flex-col gap-1.5 rounded-xl border border-grayscale-3/75 bg-grayscale-1/70 p-2.5 transition-[border-color,background-color,transform] duration-150 ease-[var(--ease-out-soft)] hover:border-grayscale-4 hover:bg-grayscale-2/80 active:scale-[0.985] dark:border-white/[0.09] dark:bg-[#171715] dark:hover:bg-[#1d1d1b]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10.5px] font-semibold text-grayscale-9">
                            {solicitud.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <PrioridadChip prioridad={solicitud.prioridad} />
                            <span
                              className={cn(
                                "font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                sla.estadoSla === "EXCEDIDO"
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : sla.estadoSla === "POR_VENCER"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-grayscale-3 text-grayscale-10",
                              )}
                            >
                              {sla.etiquetaCorta}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-[12px] font-medium text-grayscale-11 group-hover:text-grayscale-12">
                            {solicitud.titulo}
                          </p>
                          <ArrowRightIcon
                            size={11}
                            className="shrink-0 text-grayscale-8 transition-[transform,color] duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:text-grayscale-12"
                          />
                        </div>

                        {/* Mini barra de consumo SLA (4 segmentos) */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 4 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-200",
                                idx < sla.segmentosActivos
                                  ? colorSegmento
                                  : "bg-grayscale-3/80 dark:bg-white/[0.08]",
                              )}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] text-grayscale-9">
                          <span className="truncate">{solicitud.ubicacion}</span>
                          <span className="shrink-0">
                            <TiempoRelativo fecha={solicitud.creadaEn} />
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-3.5 py-2 text-[10.5px] text-grayscale-9 flex items-center justify-between">
              <span>Resolución dentro de política</span>
              <span className="font-mono font-semibold text-grayscale-11">
                {kpis.tiempoMedioHoras}h prom.
              </span>
            </div>
          </div>

          {/* Card 2: Desglose de carga activa por prioridad */}
          <div className="rounded-[1.25rem] border border-grayscale-3/85 bg-white p-4 shadow-2xs dark:border-white/[0.12] dark:bg-[#161614]">
            <div className="flex items-center justify-between gap-2 border-b border-grayscale-3/70 pb-2.5 dark:border-white/[0.08]">
              <span className="text-[12px] font-semibold text-grayscale-12">
                Carga activa por prioridad
              </span>
              <span className="font-mono text-[10.5px] text-grayscale-9">
                {abiertasTotal} abiertas
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {desglosePrioridad.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-grayscale-11">
                      <span className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
                      {item.label}
                    </span>
                    <span className="font-mono text-[10.5px] text-grayscale-9 tabular-nums">
                      {item.count}{" "}
                      <span className="text-grayscale-8">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-grayscale-3/70 dark:bg-white/[0.07]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out-soft)]",
                        item.bar,
                      )}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-grayscale-3/60 pt-2.5 font-mono text-[10.5px] text-grayscale-9 dark:border-white/[0.07]">
              <span>Meta SLA objetivo: 48h</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  kpis.tiempoMedioHoras <= 48
                    ? "text-green-9"
                    : "text-amber-9",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    kpis.tiempoMedioHoras <= 48 ? "bg-green-8" : "bg-amber-8",
                  )}
                />
                {kpis.tiempoMedioHoras <= 48 ? "En meta" : "Sobre meta"}
              </span>
            </div>
          </div>

          {/* Card 3: Atajo rápido de productividad */}
          <Link
            href="/solicitudes/nueva"
            className="group flex items-center justify-between gap-3 rounded-xl border border-grayscale-3/80 bg-grayscale-1 px-4 py-3 transition-[border-color,background-color,transform] duration-150 ease-[var(--ease-out-soft)] hover:border-grayscale-4 hover:bg-grayscale-2/70 active:scale-[0.985] dark:border-white/[0.08] dark:bg-[#161614] dark:hover:border-white/[0.16] dark:hover:bg-[#1b1b19]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-11 transition-colors group-hover:bg-grayscale-3 dark:bg-[#20201e] dark:group-hover:bg-[#282825]">
                <SparkleIcon size={14} weight="fill" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-medium text-grayscale-12">
                  Registro rápido
                </span>
                <span className="text-[10.5px] text-grayscale-9">
                  Atajo global de teclado
                </span>
              </div>
            </div>
            <kbd className="rounded-md border border-grayscale-4 bg-white px-2 py-0.5 font-mono text-[10.5px] font-semibold text-grayscale-12 shadow-2xs dark:border-white/[0.15] dark:bg-[#222220]">
              N
            </kbd>
          </Link>
        </aside>
      </div>
    </div>
  );
}
