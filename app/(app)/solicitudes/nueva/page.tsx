"use client";

import {
  CheckIcon,
  ClipboardTextIcon,
  MapPinIcon,
  TagIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import Button from "@/components/public/Button";
import { EvidenceUploader } from "@/components/ui/EvidenceUploader";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  OPCIONES_PRIORIDAD,
  type Prioridad,
  PriorityPicker,
} from "@/components/ui/PriorityPicker";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { SlotText } from "@/components/ui/SlotText";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeCrearSolicitud } from "@/lib/mantenimiento/auth";
import { crearSolicitud, getUsuarioActual } from "@/lib/mantenimiento/store";
import type { AdjuntoEvidencia, Usuario } from "@/lib/mantenimiento/types";

const ETIQUETA = "block text-[12.5px] font-medium text-grayscale-11";
const TOTAL_SEGMENTOS = 12;

const UBICACIONES_SUGERIDAS = [
  "Nave 1 · Planta",
  "Edificio B · Piso 2",
  "Laboratorio de calidad 2",
  "Cuarto de máquinas",
  "Sala de servidores",
];

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());

  useEffect(() => {
    const actualizar = () => setUsuario(getUsuarioActual());
    actualizar();
    window.addEventListener("usuario-cambiado", actualizar);
    return () => window.removeEventListener("usuario-cambiado", actualizar);
  }, []);

  const [titulo, setTitulo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA");
  const [adjuntos, setAdjuntos] = useState<AdjuntoEvidencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const autorizado = puedeCrearSolicitud(usuario);
  const cancelar = () => router.push("/mis-solicitudes");

  useAtajos(
    {
      "ctrl+enter": () => formRef.current?.requestSubmit(),
      escape: cancelar,
    },
    autorizado,
  );

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Nueva solicitud"
        usuario={usuario}
        rolesPermitidos={["EMPLEADO"]}
        motivo="La creación de nuevos reportes de mantenimiento está habilitada para las cuentas del personal solicitante."
      />
    );
  }

  const prioridadActiva =
    OPCIONES_PRIORIDAD.find((opcion) => opcion.id === prioridad) ??
    OPCIONES_PRIORIDAD[1];

  const tituloListo = titulo.trim().length >= 4;
  const ubicacionLista = ubicacion.trim().length >= 3;
  const descripcionLista = descripcion.trim().length >= 10;
  const camposListos =
    Number(tituloListo) + Number(ubicacionLista) + Number(descripcionLista);
  const segmentosReporte =
    camposListos === 0 ? 0 : camposListos === 1 ? 4 : camposListos === 2 ? 8 : 12;

  const faltaTitulo = intento > 0 && !titulo.trim();
  const faltaUbicacion = intento > 0 && !ubicacion.trim();
  const faltaDescripcion = intento > 0 && !descripcion.trim();
  const hayFaltantes = faltaTitulo || faltaUbicacion || faltaDescripcion;

  const detalleLen = descripcion.trim().length;
  const segmentosDetalle =
    detalleLen === 0
      ? 0
      : Math.min(TOTAL_SEGMENTOS, Math.max(1, Math.ceil(detalleLen / 22)));

  const guiaDescripcion =
    detalleLen === 0
      ? "La descripción es obligatoria para asignar al técnico."
      : detalleLen < 25
        ? "Agrega un poco más de contexto sobre la falla."
        : detalleLen < 120
          ? "Buen nivel de detalle para el diagnóstico inicial."
          : "Contexto completo listo para atención técnica.";

  const estadoPie =
    camposListos === 3
      ? "Listo para registrar en bandeja"
      : "Completa los campos requeridos (*)";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const faltantes: string[] = [];
    if (!titulo.trim()) faltantes.push("título");
    if (!ubicacion.trim()) faltantes.push("ubicación");
    if (!descripcion.trim()) faltantes.push("descripción");

    if (faltantes.length > 0) {
      const detalleFaltantes =
        faltantes.length === 1
          ? faltantes[0]
          : `${faltantes.slice(0, -1).join(", ")} y ${faltantes[faltantes.length - 1]}`;
      setError(`Completa los campos marcados en rojo: ${detalleFaltantes}.`);
      setIntento((valor) => valor + 1);
      return;
    }

    try {
      setEnviando(true);
      const nueva = crearSolicitud({
        creadorId: usuario.id,
        titulo,
        ubicacion,
        descripcion,
        prioridad,
        adjuntos,
      });

      fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          ubicacion,
          descripcion,
          prioridad,
          adjuntos,
        }),
      }).catch(() => {});

      router.push(`/solicitudes/${nueva.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la solicitud.",
      );
      setIntento((valor) => valor + 1);
      setEnviando(false);
    }
  };

  const restantes = 800 - descripcion.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl 2xl:max-w-4xl flex-1 flex-col justify-between gap-6">
      <div className="space-y-5">
        <PageHeader
          eyebrow="Registro"
          volver={{ href: "/mis-solicitudes", label: "Mis solicitudes" }}
          titulo="Nueva solicitud"
          descripcion="Cuéntanos qué ocurre, dónde y desde cuándo. Cuanto más concreto sea el detalle, más rápida será la atención."
        />

        <SkeletonContent
          id="nueva-solicitud-form"
          label="Preparando formulario de registro"
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                key={intento}
                role="alert"
                className="surface-soft shake flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-grayscale-11"
              >
                <WarningCircleIcon
                  size={16}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                />
                <span>{error}</span>
              </div>
            )}

            {/* Tarjeta principal con chasis dual-tone */}
            <div className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="space-y-5 rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] sm:p-5">
                {/* Bloque A: Progreso del reporte en 12 segmentos */}
                <div className="rounded-xl border border-grayscale-3/75 bg-grayscale-1/60 p-3.5 dark:border-white/[0.1] dark:bg-[#171715]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-grayscale-12">
                        Estado del reporte
                      </span>
                      <span className="text-grayscale-5">|</span>
                      <span className="font-mono text-[11px] text-grayscale-9">
                        <SlotNumber
                          value={camposListos}
                          className="font-semibold text-grayscale-12"
                        />
                        /3 campos listos
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-grayscale-9">
                      <span>Prioridad</span>
                      <span className="text-grayscale-5">|</span>
                      <span className={cn("font-semibold", prioridadActiva.acento)}>
                        <SlotText
                          text={prioridadActiva.label}
                          options={{ duration: 220, stagger: 12, bounce: 0.2 }}
                        />
                      </span>
                    </div>
                  </div>

                  <div
                    skullet-block=""
                    className="mt-3 grid grid-cols-12 gap-1.5"
                    aria-hidden
                  >
                    {Array.from({ length: TOTAL_SEGMENTOS }).map((_, idx) => {
                      const pos = idx + 1;
                      const activo = pos <= segmentosReporte;
                      const tonoBarra =
                        camposListos === 3
                          ? "bg-emerald-600/80"
                          : pos <= 4
                            ? "bg-amber-500/75"
                            : "bg-blue-500/80";

                      return (
                        <div
                          key={pos}
                          className={cn(
                            "h-2 w-full rounded-[3px] transition-colors duration-300 ease-out",
                            activo
                              ? tonoBarra
                              : "bg-grayscale-3/75 dark:bg-grayscale-4/40",
                          )}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-2 grid grid-cols-3 text-[10.5px] font-medium">
                    <span
                      className={cn(
                        "truncate text-left transition-colors duration-200",
                        faltaTitulo
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : tituloListo
                            ? "font-semibold text-grayscale-12"
                            : "text-grayscale-8",
                      )}
                    >
                      1. Requerimiento
                    </span>
                    <span
                      className={cn(
                        "truncate text-center transition-colors duration-200",
                        faltaUbicacion
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : ubicacionLista
                            ? "font-semibold text-grayscale-12"
                            : "text-grayscale-8",
                      )}
                    >
                      2. Ubicación
                    </span>
                    <span
                      className={cn(
                        "truncate text-right transition-colors duration-200",
                        faltaDescripcion
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : descripcionLista
                            ? "font-semibold text-grayscale-12"
                            : "text-grayscale-8",
                      )}
                    >
                      3. Detalle
                    </span>
                  </div>
                </div>

                {/* Bloque B: Ficha compacta del solicitante */}
                <div className="grid grid-cols-1 gap-2 rounded-xl border border-grayscale-3/70 bg-grayscale-1/80 px-3.5 py-2.5 text-[11.5px] sm:grid-cols-3 dark:border-white/[0.11] dark:bg-grayscale-3/40">
                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <span className="flex items-center gap-1.5 text-grayscale-9">
                      <UserIcon size={12} className="text-grayscale-8" />
                      Solicitante
                    </span>
                    <span className="truncate font-medium text-grayscale-12">
                      {nombreLimpio(usuario.nombre)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <span className="flex items-center gap-1.5 text-grayscale-9">
                      <TagIcon size={12} className="text-grayscale-8" />
                      Área
                    </span>
                    <span className="truncate font-medium text-grayscale-12">
                      {usuario.departamento}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <span className="flex items-center gap-1.5 text-grayscale-9">
                      <ClipboardTextIcon size={12} className="text-grayscale-8" />
                      Estado
                    </span>
                    <span className="truncate font-mono text-[11px] font-medium text-grayscale-12">
                      Registrada
                    </span>
                  </div>
                </div>

                {/* Bloque C: Título del requerimiento */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="titulo"
                      className={cn(
                        ETIQUETA,
                        faltaTitulo && "text-red-600 dark:text-red-400",
                      )}
                    >
                      Título del requerimiento{" "}
                      <span
                        className={cn(
                          faltaTitulo
                            ? "text-red-600 dark:text-red-400"
                            : "text-grayscale-9",
                        )}
                      >
                        *
                      </span>
                    </label>
                    <span className="num font-mono text-[10.5px] text-grayscale-8">
                      <SlotNumber value={titulo.length} />/120
                    </span>
                  </div>
                  <input
                    id="titulo"
                    type="text"
                    maxLength={120}
                    aria-invalid={faltaTitulo}
                    placeholder="Ej. Gotera en el techo del laboratorio 2"
                    value={titulo}
                    onChange={(event) => {
                      const val = event.target.value;
                      setTitulo(val);
                      if (
                        error &&
                        val.trim() &&
                        ubicacion.trim() &&
                        descripcion.trim()
                      ) {
                        setError(null);
                      }
                    }}
                    className="campo w-full px-3.5 py-2.5 text-[16px] sm:text-[13.5px]"
                  />
                  {faltaTitulo && (
                    <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                      Falta el título del requerimiento
                    </p>
                  )}
                </div>

                {/* Bloque D: Ubicación física con sugerencias táctiles */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <label
                      htmlFor="ubicacion"
                      className={cn(
                        ETIQUETA,
                        faltaUbicacion && "text-red-600 dark:text-red-400",
                      )}
                    >
                      Ubicación física{" "}
                      <span
                        className={cn(
                          faltaUbicacion
                            ? "text-red-600 dark:text-red-400"
                            : "text-grayscale-9",
                        )}
                      >
                        *
                      </span>
                    </label>
                    <span className="text-[11px] text-grayscale-9">
                      Edificio, piso, nave o área exacta
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="ubicacion"
                      type="text"
                      aria-invalid={faltaUbicacion}
                      placeholder="Ej. Edificio B · Piso 2, Oficina 204"
                      value={ubicacion}
                      onChange={(event) => {
                        const val = event.target.value;
                        setUbicacion(val);
                        if (
                          error &&
                          titulo.trim() &&
                          val.trim() &&
                          descripcion.trim()
                        ) {
                          setError(null);
                        }
                      }}
                      className="campo w-full py-2.5 pl-9 pr-3.5 text-[16px] sm:text-[13.5px]"
                    />
                    <MapPinIcon
                      size={15}
                      className={cn(
                        "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
                        faltaUbicacion
                          ? "text-red-500 dark:text-red-400"
                          : "text-grayscale-8",
                      )}
                    />
                  </div>

                  {faltaUbicacion && (
                    <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                      Falta indicar la ubicación física
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    {UBICACIONES_SUGERIDAS.map((sugerencia) => {
                      const seleccionada = ubicacion === sugerencia;

                      return (
                        <button
                          key={sugerencia}
                          type="button"
                          onClick={() => {
                            setUbicacion(sugerencia);
                            if (error && titulo.trim() && descripcion.trim()) {
                              setError(null);
                            }
                          }}
                          className={cn(
                            "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
                            seleccionada
                              ? "border-grayscale-6 bg-grayscale-2 font-medium text-grayscale-12 dark:bg-grayscale-3"
                              : "border-grayscale-3/80 bg-grayscale-1/60 text-grayscale-9 hover:border-grayscale-5 hover:text-grayscale-12 dark:border-white/[0.11] dark:bg-grayscale-3/25",
                          )}
                        >
                          {sugerencia}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bloque E: Prioridad estimada */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className={ETIQUETA}>Prioridad estimada</span>
                    <span className="text-[11px] text-grayscale-9">
                      Podrás ajustarla durante la atención
                    </span>
                  </div>
                  <PriorityPicker value={prioridad} onChange={setPrioridad} />
                </div>

                {/* Bloque F: Descripción detallada con medidor en vivo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="descripcion"
                      className={cn(
                        ETIQUETA,
                        faltaDescripcion && "text-red-600 dark:text-red-400",
                      )}
                    >
                      Descripción detallada{" "}
                      <span
                        className={cn(
                          faltaDescripcion
                            ? "text-red-600 dark:text-red-400"
                            : "text-grayscale-9",
                        )}
                      >
                        *
                      </span>
                    </label>
                    <span
                      className={cn(
                        "num font-mono text-[11px]",
                        restantes < 80 ? "text-grayscale-11" : "text-grayscale-9",
                      )}
                    >
                      <SlotNumber value={descripcion.length} />/800
                    </span>
                  </div>

                  <textarea
                    id="descripcion"
                    rows={4}
                    maxLength={800}
                    aria-invalid={faltaDescripcion}
                    placeholder="Describe los síntomas, equipos involucrados, horarios y cualquier antecedente relevante…"
                    value={descripcion}
                    onChange={(event) => {
                      const val = event.target.value;
                      setDescripcion(val);
                      if (
                        error &&
                        titulo.trim() &&
                        ubicacion.trim() &&
                        val.trim()
                      ) {
                        setError(null);
                      }
                    }}
                    className="campo w-full resize-y px-3.5 py-2.5 text-[16px] leading-relaxed sm:text-[13.5px]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <span
                      className={cn(
                        "text-[11px]",
                        faltaDescripcion
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-grayscale-9",
                      )}
                    >
                      {faltaDescripcion ? (
                        "Falta describir el problema con detalle"
                      ) : (
                        <SlotText
                          text={guiaDescripcion}
                          options={{ duration: 220, stagger: 8, bounce: 0.18 }}
                        />
                      )}
                    </span>

                    <div
                      aria-hidden
                      skullet-block=""
                      className="flex items-center gap-[2px]"
                    >
                      {Array.from({ length: TOTAL_SEGMENTOS }).map((_, idx) => {
                        const activa = idx < segmentosDetalle;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "h-2 w-[3px] rounded-full transition-colors duration-200",
                              activa
                                ? descripcionLista
                                  ? "bg-emerald-600/80"
                                  : "bg-amber-500/80"
                                : "bg-grayscale-3/75 dark:bg-grayscale-4/40",
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bloque G: Evidencia gráfica (drag & drop / cámara) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className={ETIQUETA}>Evidencia fotográfica</span>
                    <span className="text-[11px] text-grayscale-9">
                      Ayuda al técnico a llevar el equipo o repuesto adecuado
                    </span>
                  </div>
                  <EvidenceUploader
                    value={adjuntos}
                    onChange={setAdjuntos}
                    etapa="REPORTE"
                  />
                </div>
              </div>

              {/* Pie inferior del chasis dual-tone responsivo */}
              <div className="flex flex-col gap-2.5 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span
                  className={cn(
                    "text-[11px]",
                    hayFaltantes
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-grayscale-9",
                  )}
                >
                  <SlotText
                    text={
                      hayFaltantes
                        ? "Faltan datos obligatorios marcados en rojo"
                        : estadoPie
                    }
                    options={{ duration: 220, stagger: 10, bounce: 0.2 }}
                  />
                </span>

                <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelar}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={enviando}
                    className="flex-1 px-4 sm:flex-initial"
                  >
                    {!enviando && <CheckIcon size={14} weight="bold" />}
                    <SlotText
                      text={enviando ? "Registrando…" : "Registrar solicitud"}
                      options={{ duration: 260, stagger: 14, bounce: 0.22 }}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </SkeletonContent>
      </div>

      <BottomBar
        statusInfo={{
          title: "Nueva ficha de incidencia",
          subtitle:
            "Ingresará como Registrada y quedará disponible en la bandeja técnica.",
        }}
        shortcuts={[
          { key: "Ctrl + Enter", label: "Registrar" },
          { key: "Esc", label: "Cancelar" },
        ]}
      />
    </div>
  );
}
