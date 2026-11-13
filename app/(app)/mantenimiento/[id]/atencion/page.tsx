"use client";

import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  MapPinIcon,
  UserIcon,
  WarningCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { SlaPanel } from "@/components/mantenimiento/SlaPanel";
import Button from "@/components/public/Button";
import { EvidenceGallery } from "@/components/ui/EvidenceGallery";
import { EvidenceUploader } from "@/components/ui/EvidenceUploader";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { SlotText } from "@/components/ui/SlotText";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeGestionarAtencion } from "@/lib/mantenimiento/auth";
import {
  cambiarEstadoSolicitud,
  DETALLE_MUESTRA,
  getDetalleSolicitud,
  getUsuarioActual,
} from "@/lib/mantenimiento/store";
import {
  type AdjuntoEvidencia,
  type Estado,
  type SolicitudConDetalles,
  TRANSICIONES_VALIDAS,
  type Usuario,
} from "@/lib/mantenimiento/types";

interface Props {
  params: Promise<{ id: string }>;
}

const ETAPAS_FLUJO: {
  estado: Estado;
  paso: number;
  label: string;
}[] = [
  {
    estado: "REGISTRADA",
    paso: 1,
    label: "Registrada",
  },
  {
    estado: "EN_PROCESO",
    paso: 2,
    label: "En atención",
  },
  {
    estado: "CERRADA",
    paso: 3,
    label: "Finalizada",
  },
];

const ACCIONES: {
  estado: Estado;
  paso: number;
  categoria: string;
  titulo: string;
  detalle: string;
  regla: string;
  icon: typeof WrenchIcon;
  dot: string;
  iconColor: string;
  barFill: string;
  ticksActivos: number;
}[] = [
  {
    estado: "EN_PROCESO",
    paso: 2,
    categoria: "Etapa 02",
    titulo: "Iniciar atención técnica",
    detalle: "Diagnóstico en sitio, desmontaje de equipo o espera de refacciones.",
    regla: "Nota opcional",
    icon: WrenchIcon,
    dot: "bg-blue-500",
    iconColor: "text-blue-600 dark:text-blue-400",
    barFill: "bg-blue-500",
    ticksActivos: 8,
  },
  {
    estado: "CERRADA",
    paso: 3,
    categoria: "Etapa 03",
    titulo: "Finalizar y cerrar solicitud",
    detalle: "Concluir el servicio técnico, validar operación y archivar expediente.",
    regla: "Informe técnico requerido",
    icon: CheckCircleIcon,
    dot: "bg-emerald-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    barFill: "bg-emerald-600",
    ticksActivos: 12,
  },
];

const ETIQUETA_BASE = "block text-[12.5px] font-semibold text-grayscale-12";

export default function AtencionYCierrePage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const formRef = useRef<HTMLFormElement>(null);

  const [solicitud, setSolicitud] = useState<
    SolicitudConDetalles | null | undefined
  >(undefined);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [nuevoEstado, setNuevoEstado] = useState<Estado>("EN_PROCESO");
  const [nota, setNota] = useState("");
  const [adjuntos, setAdjuntos] = useState<AdjuntoEvidencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      setUsuario(getUsuarioActual());
      const actual = getDetalleSolicitud(id);
      setSolicitud(actual ?? null);
      if (actual) {
        const permitidos = TRANSICIONES_VALIDAS[actual.estado];
        if (permitidos[0]) setNuevoEstado(permitidos[0]);
      }
    };
    actualizar();
    window.addEventListener("usuario-cambiado", actualizar);
    return () => window.removeEventListener("usuario-cambiado", actualizar);
  }, [id]);

  const autorizado = puedeGestionarAtencion(usuario);
  const cancelar = () => router.push(`/solicitudes/${id}`);

  useAtajos(
    {
      "ctrl+enter": () => formRef.current?.requestSubmit(),
      escape: cancelar,
    },
    solicitud !== undefined && autorizado,
  );

  if (solicitud === null) {
    notFound();
  }

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Atención y cierre técnico"
        usuario={usuario}
        rolesPermitidos={["TECNICO"]}
        motivo="La gestión de estados de atención y el cierre técnico de incidencias están reservados para el personal de mantenimiento."
      />
    );
  }

  const cargando = solicitud === undefined;
  const ficha = solicitud ?? DETALLE_MUESTRA;

  const permitidos = TRANSICIONES_VALIDAS[ficha.estado];
  const notaObligatoria = nuevoEstado === "CERRADA";
  const sinTransiciones = permitidos.length === 0;
  const faltaNota = intento > 0 && notaObligatoria && !nota.trim();

  const indiceActual = ETAPAS_FLUJO.findIndex((e) => e.estado === ficha.estado);
  const indiceDestino = sinTransiciones
    ? indiceActual
    : ETAPAS_FLUJO.findIndex((e) => e.estado === nuevoEstado);
  const etapaDestino = ETAPAS_FLUJO[indiceDestino] ?? ETAPAS_FLUJO[0];

  // Escala visual de 12 segmentos limpia (sin líneas negras)
  const TOTAL_SEGMENTOS = 12;
  const segmentosCubiertos =
    indiceDestino === 0 ? 4 : indiceDestino === 1 ? 8 : 12;

  const handleTransicion = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!solicitud) return;

    if (notaObligatoria && !nota.trim()) {
      setError(
        "Para cerrar la solicitud es obligatorio registrar la nota técnica del trabajo efectuado.",
      );
      setIntento((valor) => valor + 1);
      return;
    }

    try {
      setGuardando(true);
      cambiarEstadoSolicitud({
        solicitudId: solicitud.id,
        autorId: usuario.id,
        nuevoEstado,
        nota,
        adjuntos,
      });

      fetch(`/api/solicitudes/${solicitud.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado, nota, adjuntos }),
      }).catch(() => {});

      router.push(`/solicitudes/${solicitud.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado.",
      );
      setIntento((valor) => valor + 1);
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl 2xl:max-w-4xl flex flex-1 flex-col justify-between gap-6">
      <SkeletonContent
        id={`atencion-${id}`}
        loading={cargando}
        label="Cargando formulario de atención"
      >
        <div className="flex flex-col gap-5">
          <PageHeader
            codigo="I06"
            eyebrow="Operación técnica"
            volver={{
              href: `/solicitudes/${ficha.id}`,
              label: "Ficha técnica",
            }}
            meta={
              <>
                <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-grayscale-10 dark:bg-grayscale-2/70">
                  {ficha.id}
                </span>
                <EstadoBadge estado={ficha.estado} size="sm" />
                <PrioridadChip prioridad={ficha.prioridad} />
              </>
            }
            titulo="Atención y cierre"
            descripcion="Selecciona la etapa del flujo técnico y documenta el dictamen de intervención."
          />

          {/* 1. Tarjeta de contexto del expediente */}
          <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    skullet-block=""
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-grayscale-3/90 bg-grayscale-1 text-grayscale-11 shadow-2xs dark:border-grayscale-4/60 dark:bg-grayscale-3"
                  >
                    <ClipboardTextIcon size={17} weight="duotone" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      {ficha.titulo}
                    </h2>
                    <p className="mt-0.5 font-mono text-[10.5px] text-grayscale-9">
                      #{ficha.id} <span className="text-grayscale-5">|</span> Reporte de infraestructura
                    </p>
                  </div>
                </div>
              </div>

              <p className="line-clamp-2 text-[12.5px] leading-relaxed text-grayscale-10">
                {ficha.descripcion}
              </p>

              {/* Caja gris interna con pares clave/valor */}
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-grayscale-3/70 bg-grayscale-1/80 px-3.5 py-2.5 text-[11.5px] sm:grid-cols-3 dark:border-white/[0.11] dark:bg-grayscale-3/40">
                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  <span className="flex items-center gap-1.5 text-grayscale-9">
                    <MapPinIcon size={12} className="text-grayscale-8" />
                    Ubicación
                  </span>
                  <span className="truncate font-medium text-grayscale-12">
                    {ficha.ubicacion}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  <span className="flex items-center gap-1.5 text-grayscale-9">
                    <UserIcon size={12} className="text-grayscale-8" />
                    Solicita
                  </span>
                  <span className="truncate font-medium text-grayscale-12">
                    {nombreLimpio(ficha.creador.nombre)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  <span className="flex items-center gap-1.5 text-grayscale-9">
                    <CalendarBlankIcon size={12} className="text-grayscale-8" />
                    Ingreso
                  </span>
                  <span className="truncate font-medium text-grayscale-12">
                    <TiempoRelativo fecha={ficha.creadaEn} />
                  </span>
                </div>
              </div>

              <SlaPanel solicitud={ficha} />

              {ficha.adjuntos && ficha.adjuntos.length > 0 && (
                <EvidenceGallery
                  adjuntos={ficha.adjuntos}
                  titulo="Evidencia adjunta del expediente"
                  compacto
                />
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-grayscale-9">
              <span>Departamento: {ficha.creador.departamento}</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
                <SlotNumber value={ficha.historial.length} className="font-semibold text-grayscale-11" />
                <span>movimientos</span>
              </span>
            </div>
          </section>

          {/* 2. Formulario principal de Acción Técnica */}
          <form
            ref={formRef}
            onSubmit={handleTransicion}
            className="space-y-4"
          >
            {error && (
              <div
                key={intento}
                role="alert"
                className="surface-soft shake flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12px] text-grayscale-11 border border-red-500/20 bg-red-500/10"
              >
                <WarningCircleIcon
                  size={16}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-5">
                
                {/* Bloque A: Escala de resolución limpia con separadores `|` */}
                <div className="rounded-xl border border-grayscale-3/75 bg-grayscale-1/60 p-3.5 dark:border-white/[0.1] dark:bg-[#171715]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-grayscale-12">
                        Escala de resolución
                      </span>
                      <span className="text-grayscale-5">|</span>
                      <span className="font-mono text-[11px] text-grayscale-9">
                        Paso{" "}
                        <SlotNumber
                          value={etapaDestino.paso}
                          className="font-semibold text-grayscale-12"
                        />
                        /3
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-grayscale-9">
                      <span>Destino</span>
                      <span className="text-grayscale-5">|</span>
                      <span className="font-semibold text-grayscale-12">
                        {etapaDestino.label}
                      </span>
                    </div>
                  </div>

                  {/* Pista de 12 segmentos (sin palito negro que ensucie el final) */}
                  <div
                    skullet-block=""
                    className="mt-3 grid grid-cols-12 gap-1.5"
                    aria-hidden
                  >
                    {Array.from({ length: TOTAL_SEGMENTOS }).map((_, idx) => {
                      const pos = idx + 1;
                      const activo = pos <= segmentosCubiertos;
                      const colorBarra =
                        pos <= 4
                          ? "bg-amber-500/75"
                          : pos <= 8
                            ? "bg-blue-500/80"
                            : "bg-emerald-600/80";

                      return (
                        <div
                          key={pos}
                          className={cn(
                            "h-2.5 w-full rounded-[3px] transition-colors duration-300",
                            activo
                              ? colorBarra
                              : "bg-grayscale-3/75 dark:bg-grayscale-4/40",
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Etiquetas inferiores de las 3 etapas */}
                  <div className="mt-2 grid grid-cols-3 text-[10.5px] font-medium">
                    {ETAPAS_FLUJO.map((etapa, i) => {
                      const esActual = etapa.estado === ficha.estado;
                      const esSeleccionada = etapa.estado === etapaDestino.estado;
                      return (
                        <span
                          key={etapa.estado}
                          className={cn(
                            "transition-colors",
                            i === 0
                              ? "text-left"
                              : i === 1
                                ? "text-center"
                                : "text-right",
                            esSeleccionada
                              ? "font-semibold text-grayscale-12"
                              : esActual
                                ? "text-grayscale-10"
                                : "text-grayscale-8",
                          )}
                        >
                          {etapa.label}
                          {esActual && " · actual"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bloque B: Selector de Acción Técnica (superficie blanca neutra, sin efecto neón) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={ETIQUETA_BASE}>Acción técnica</span>
                    <span className="font-mono text-[11px] text-grayscale-9">
                      {sinTransiciones
                        ? "Expediente finalizado"
                        : `${permitidos.length} ${
                            permitidos.length === 1
                              ? "transición disponible"
                              : "transiciones disponibles"
                          }`}
                    </span>
                  </div>

                  {sinTransiciones ? (
                    <div className="rounded-xl border border-grayscale-3/80 bg-grayscale-1 px-4 py-4 text-center text-[12.5px] text-grayscale-10 dark:border-white/[0.11] dark:bg-grayscale-3/40">
                      Esta solicitud ya fue cerrada y no admite más transiciones.
                    </div>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-label="Nueva acción técnica"
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      {ACCIONES.map((accion) => {
                        const habilitada = permitidos.includes(accion.estado);
                        const yaCompletada =
                          !habilitada &&
                          ((accion.estado === "EN_PROCESO" &&
                            ficha.estado === "EN_PROCESO") ||
                            ficha.estado === "CERRADA");
                        const activo = nuevoEstado === accion.estado && habilitada;
                        const Icon = accion.icon;

                        return (
                          <button
                            key={accion.estado}
                            type="button"
                            role="radio"
                            aria-checked={activo}
                            disabled={!habilitada}
                            onClick={() => {
                              setNuevoEstado(accion.estado);
                              if (accion.estado !== "CERRADA" && error) {
                                setError(null);
                              }
                            }}
                            className={cn(
                              "group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200",
                              activo
                                ? "border-grayscale-6 bg-grayscale-1/70 shadow-xs dark:border-grayscale-5 dark:bg-grayscale-3/40"
                                : habilitada
                                  ? "cursor-pointer border-grayscale-3/85 bg-white hover:border-grayscale-5 dark:border-white/[0.12] dark:bg-[#161614] dark:hover:bg-grayscale-3/60"
                                  : "cursor-not-allowed border-dashed border-grayscale-3/80 bg-grayscale-1/35 opacity-60 dark:border-white/[0.08] dark:bg-grayscale-3/15",
                            )}
                          >
                            <div>
                              {/* Fila 1: Punto discreto + Etapa | Estado en texto limpio (sin badges) */}
                              <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] text-grayscale-9">
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "size-2 shrink-0 rounded-full",
                                      activo
                                        ? accion.dot
                                        : yaCompletada
                                          ? "bg-grayscale-7"
                                          : "bg-grayscale-5",
                                    )}
                                  />
                                  <span>{accion.categoria}</span>
                                  <span className="text-grayscale-5">|</span>
                                  <span
                                    className={cn(
                                      activo
                                        ? "font-semibold text-grayscale-12"
                                        : "text-grayscale-9",
                                    )}
                                  >
                                    {yaCompletada
                                      ? "En curso"
                                      : activo
                                        ? "Seleccionada"
                                        : "Disponible"}
                                  </span>
                                </span>
                              </div>

                              {/* Fila 2: Título + icono en pastilla neutra */}
                              <div className="mt-2.5 flex items-center justify-between gap-2.5">
                                <span
                                  className={cn(
                                    "text-[14px] font-semibold tracking-[-0.01em]",
                                    habilitada
                                      ? "text-grayscale-12"
                                      : "text-grayscale-9",
                                  )}
                                >
                                  {accion.titulo}
                                </span>

                                <span
                                  skullet-block=""
                                  className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-lg border border-grayscale-3/90 bg-grayscale-1 transition-colors dark:border-grayscale-4/60 dark:bg-grayscale-3",
                                    activo ? accion.iconColor : "text-grayscale-9",
                                  )}
                                >
                                  <Icon size={14} weight="bold" />
                                </span>
                              </div>

                              {/* Fila 3: Descripción concisa */}
                              <p className="mt-1.5 text-[12px] leading-relaxed text-grayscale-10">
                                {accion.detalle}
                              </p>
                            </div>

                            {/* Fila 4: Pie con mini-barras (`||||||||....`) | regla */}
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-grayscale-3/60 pt-2.5 text-[10.5px] text-grayscale-9 dark:border-white/[0.08]">
                              <div
                                aria-hidden
                                skullet-block=""
                                className="flex items-center gap-[2px]"
                              >
                                {Array.from({ length: 12 }).map((_, t) => (
                                  <div
                                    key={t}
                                    className={cn(
                                      "h-2.5 w-[2.5px] rounded-full transition-colors duration-300",
                                      t < accion.ticksActivos
                                        ? activo
                                          ? accion.barFill
                                          : "bg-grayscale-7"
                                        : "bg-grayscale-3 dark:bg-grayscale-4/50",
                                    )}
                                  />
                                ))}
                              </div>

                              <span className="font-mono text-[10px] text-grayscale-9">
                                {yaCompletada ? "Etapa actual" : accion.regla}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bloque C: Nota técnica de atención con separador `|` en lugar de badge */}
                {!sinTransiciones && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <label
                        htmlFor="nota"
                        className={cn(
                          ETIQUETA_BASE,
                          faltaNota && "text-red-600 dark:text-red-400",
                        )}
                      >
                        Dictamen y nota técnica{" "}
                        {notaObligatoria ? (
                          <span
                            className={cn(
                              faltaNota
                                ? "text-red-600 dark:text-red-400"
                                : "text-grayscale-9",
                            )}
                          >
                            *
                          </span>
                        ) : (
                          <span className="text-[11px] font-normal text-grayscale-9">
                            (opcional)
                          </span>
                        )}
                      </label>

                      <span className="font-mono text-[10.5px] text-grayscale-9">
                        {notaObligatoria ? (
                          <>
                            <span
                              className={cn(
                                "font-medium",
                                faltaNota
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-grayscale-11",
                              )}
                            >
                              Obligatoria al cerrar
                            </span>{" "}
                            <span className="text-grayscale-5">|</span> Informe de cierre
                          </>
                        ) : (
                          <>
                            <span>Opcional</span>{" "}
                            <span className="text-grayscale-5">|</span> Diagnóstico inicial
                          </>
                        )}
                      </span>
                    </div>

                    <textarea
                      id="nota"
                      rows={4}
                      aria-invalid={faltaNota}
                      value={nota}
                      onChange={(event) => {
                        const val = event.target.value;
                        setNota(val);
                        if (error && val.trim()) {
                          setError(null);
                        }
                      }}
                      placeholder={
                        notaObligatoria
                          ? "Describe el trabajo efectuado, refacciones instaladas, pruebas de verificación y conformidad del área…"
                          : "Anota observaciones iniciales del diagnóstico o materiales requeridos…"
                      }
                      className="campo w-full resize-y px-3.5 py-2.5 text-[16px] leading-relaxed sm:text-[13px]"
                    />

                    {faltaNota && (
                      <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                        Falta registrar el dictamen técnico para poder cerrar la solicitud.
                      </p>
                    )}
                  </div>
                )}

                {/* Bloque D: Evidencia técnica de intervención */}
                {!sinTransiciones && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={ETIQUETA_BASE}>
                        Evidencia de intervención{" "}
                        <span className="text-[11px] font-normal text-grayscale-9">
                          (opcional)
                        </span>
                      </span>
                      <span className="font-mono text-[10.5px] text-grayscale-9">
                        Fotografía de diagnóstico o trabajo terminado
                      </span>
                    </div>
                    <EvidenceUploader
                      value={adjuntos}
                      onChange={setAdjuntos}
                      etapa="ATENCION"
                    />
                  </div>
                )}
              </div>

              {/* Pie inferior en el chasis gris con resumen de transición + botones */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2 font-mono text-[10.5px] text-grayscale-9">
                  <span className="uppercase">{ficha.estado.replace("_", " ")}</span>
                  <ArrowRightIcon size={11} className="text-grayscale-8" />
                  <span className="font-semibold uppercase text-grayscale-12">
                    {etapaDestino.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" onClick={cancelar}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={guardando || sinTransiciones}
                    className="px-4"
                  >
                    <CheckCircleIcon size={14} weight="bold" />
                    <SlotText
                      text={
                        guardando
                          ? "Aplicando…"
                          : nuevoEstado === "CERRADA"
                            ? "Finalizar y cerrar"
                            : "Iniciar atención"
                      }
                    />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: sinTransiciones
            ? "Solicitud cerrada"
            : `Transición: ${ficha.estado.replace("_", " ").toLowerCase()} → ${nuevoEstado
                .replace("_", " ")
                .toLowerCase()}`,
          subtitle: `Operador: ${nombreLimpio(usuario.nombre)} · ${usuario.cargo}`,
        }}
        shortcuts={[
          { key: "Ctrl + Enter", label: "Aplicar cambio" },
          { key: "Esc", label: "Cancelar" },
        ]}
      />
    </div>
  );
}
