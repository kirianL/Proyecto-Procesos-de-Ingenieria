"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  DownloadSimpleIcon,
  MapPinIcon,
  PrinterIcon,
  StarIcon,
  UserIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { SlaPanel } from "@/components/mantenimiento/SlaPanel";
import { Timeline } from "@/components/mantenimiento/Timeline";
import Button from "@/components/public/Button";
import { EvidenceGallery } from "@/components/ui/EvidenceGallery";
import { InfoPanel, InfoRow } from "@/components/ui/InfoPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { cn } from "@/helpers/classname-helper";
import { fechaCompleta } from "@/helpers/fecha";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeVerSolicitud } from "@/lib/mantenimiento/auth";
import {
  DETALLE_MUESTRA,
  getDetalleSolicitud,
  getUsuarioActual,
  getValoracionSolicitud,
  registrarValoracion,
} from "@/lib/mantenimiento/store";
import type {
  SolicitudConDetalles,
  Usuario,
  Valoracion,
} from "@/lib/mantenimiento/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DetalleSolicitudPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [solicitud, setSolicitud] = useState<
    SolicitudConDetalles | null | undefined
  >(() => getDetalleSolicitud(id) ?? undefined);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [valoracion, setValoracion] = useState<Valoracion | undefined>(() =>
    getValoracionSolicitud(id),
  );
  const [calificacionSel, setCalificacionSel] = useState<1 | 2 | 3 | 4 | 5>(
    () => getValoracionSolicitud(id)?.calificacion ?? 5,
  );
  const [calificacionHover, setCalificacionHover] = useState<number | null>(
    null,
  );
  const [comentarioVal, setComentarioVal] = useState<string>(
    () => getValoracionSolicitud(id)?.comentario ?? "",
  );
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      setSolicitud(getDetalleSolicitud(id) ?? null);
      setUsuario(getUsuarioActual());
      const val = getValoracionSolicitud(id);
      setValoracion(val);
      if (val) {
        setCalificacionSel(val.calificacion);
        setComentarioVal(val.comentario ?? "");
      }
    };
    actualizar();
    window.addEventListener("usuario-cambiado", actualizar);
    return () => window.removeEventListener("usuario-cambiado", actualizar);
  }, [id]);

  const esTecnico = usuario.rol === "TECNICO";
  const esCerrada = solicitud?.estado === "CERRADA";
  const bandeja =
    usuario.rol === "EMPLEADO"
      ? "/mis-solicitudes"
      : usuario.rol === "JEFATURA"
        ? "/indicadores"
        : "/mantenimiento";
  const autorizado = solicitud ? puedeVerSolicitud(usuario, solicitud) : true;

  useAtajos(
    {
      escape: () => router.push(bandeja),
      ...(autorizado
        ? { h: () => router.push(`/solicitudes/${id}/historial`) }
        : {}),
      ...(autorizado && esTecnico && !esCerrada
        ? { a: () => router.push(`/mantenimiento/${id}/atencion`) }
        : {}),
    },
    solicitud !== undefined,
  );

  if (solicitud === null) {
    notFound();
  }

  if (solicitud !== undefined && !autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Detalle de solicitud"
        usuario={usuario}
        rolesPermitidos={["TECNICO", "JEFATURA"]}
        motivo="Por privacidad, solo puedes consultar el detalle de las solicitudes registradas con tu propia cuenta."
      />
    );
  }

  const cargando = solicitud === undefined;
  const ficha = solicitud ?? DETALLE_MUESTRA;
  const ultimoEvento = ficha.historial[ficha.historial.length - 1];
  const esCreadorEmpleado =
    usuario.rol === "EMPLEADO" && usuario.id === ficha.creadorId;

  const exportarFichaCsv = () => {
    const escapar = (v: string | null | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = [
      ["Campo", "Valor"],
      ["ID", ficha.id],
      ["Titulo", ficha.titulo],
      ["Estado", ficha.estado],
      ["Prioridad", ficha.prioridad],
      ["Ubicacion", ficha.ubicacion],
      ["Solicitante", ficha.creador.nombre],
      ["Departamento", ficha.creador.departamento],
      ["Creada", ficha.creadaEn],
      ["Cerrada", ficha.cerradaEn ?? "N/A"],
      ["Valoracion CSAT", valoracion ? `${valoracion.calificacion}/5` : "Sin valorar"],
      [],
      ["Fecha Evento", "Autor", "Rol", "Estado Previo", "Estado Nuevo", "Nota"],
      ...ficha.historial.map((ev) => [
        ev.fecha,
        ev.autor.nombre,
        ev.autor.rol,
        ev.estadoPrevio ?? "INICIAL",
        ev.estadoNuevo,
        ev.nota ?? "",
      ]),
    ];
    const csv = filas
      .map((fila) => fila.map((c) => escapar(c)).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha-${ficha.id.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guardarValoracion = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva = registrarValoracion({
      solicitudId: ficha.id,
      calificacion: calificacionSel,
      comentario: comentarioVal,
    });
    setValoracion(nueva);
    setGuardadoOk(true);
    window.setTimeout(() => setGuardadoOk(false), 2500);
  };

  return (
    <div className="mx-auto w-full max-w-4xl 2xl:max-w-5xl space-y-6">
      <SkeletonContent
        id={`detalle-${id}`}
        loading={cargando}
        label="Cargando ficha de la solicitud"
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            codigo="I04"
            eyebrow="Detalle"
            volver={{
              href: bandeja,
              label: esTecnico ? "Bandeja técnica" : "Mis solicitudes",
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
            titulo={ficha.titulo}
            acciones={
              <>
                <Button
                  type="button"
                  onClick={exportarFichaCsv}
                  variant="secondary"
                  title="Descargar ficha y bitácora en CSV"
                >
                  <DownloadSimpleIcon size={14} weight="bold" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => window.print()}
                  variant="secondary"
                  title="Imprimir o guardar como PDF"
                >
                  <PrinterIcon size={14} weight="bold" />
                </Button>

                <Button
                  href={`/solicitudes/${ficha.id}/historial`}
                  variant="secondary"
                >
                  <ClockCounterClockwiseIcon size={14} weight="bold" />
                  <span>Historial</span>
                </Button>

                {esTecnico && !esCerrada && (
                  <Button
                    href={`/mantenimiento/${ficha.id}/atencion`}
                    variant="primary"
                  >
                    <WrenchIcon size={14} weight="bold" />
                    <span>Atender</span>
                  </Button>
                )}
              </>
            }
          />

          {/* Ficha técnica con fusión moderna dual-tone */}
          <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b] space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <InfoPanel>
                  <InfoRow icon={UserIcon} label="Solicitante">
                    {nombreLimpio(ficha.creador.nombre)}
                  </InfoRow>
                  <InfoRow icon={MapPinIcon} label="Ubicación">
                    <span className="line-clamp-1">{ficha.ubicacion}</span>
                  </InfoRow>
                  <InfoRow icon={CheckCircleIcon} label="Departamento">
                    {ficha.creador.departamento}
                  </InfoRow>
                </InfoPanel>

                <InfoPanel>
                  <InfoRow icon={CalendarBlankIcon} label="Registrada">
                    <TiempoRelativo fecha={ficha.creadaEn} completo />
                  </InfoRow>
                  <InfoRow
                    icon={ClockCounterClockwiseIcon}
                    label="Último movimiento"
                  >
                    {ultimoEvento ? (
                      <TiempoRelativo fecha={ultimoEvento.fecha} completo />
                    ) : (
                      "Sin eventos"
                    )}
                  </InfoRow>
                  <InfoRow icon={ClockCounterClockwiseIcon} label="Eventos">
                    <SlotNumber value={ficha.historial.length} />
                  </InfoRow>
                </InfoPanel>
              </div>

              <div className="space-y-2">
                <h2 className="section-label">Descripción del problema</h2>
                <div className="surface-soft p-4">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-grayscale-12">
                    {ficha.descripcion}
                  </p>
                </div>
              </div>

              <SlaPanel solicitud={ficha} />

              {ficha.adjuntos && ficha.adjuntos.length > 0 && (
                <EvidenceGallery
                  adjuntos={ficha.adjuntos}
                  titulo="Evidencia gráfica"
                />
              )}

              {ficha.cerradaEn && (
                <div className="surface-soft flex items-start gap-2.5 px-4 py-3 text-[12px] text-grayscale-11 border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircleIcon
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <div>
                    <p className="font-semibold text-grayscale-12">
                      Solicitud cerrada
                    </p>
                    <p className="text-grayscale-10">
                      {fechaCompleta(ficha.cerradaEn)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Franja inferior gris con resumen de estado */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-grayscale-10">
              <span>Registrado por {ficha.creador.nombre}</span>
              <span className="font-mono text-[10.5px]">ID: {ficha.id}</span>
            </div>
          </section>

          {/* Historial preview con fusión dual-tone */}
          <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b] space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-grayscale-3/80 pb-3 dark:border-grayscale-3/50">
                <h2 className="text-[13px] font-semibold text-grayscale-12">
                  Línea de tiempo reciente
                </h2>
                <Link
                  href={`/solicitudes/${ficha.id}/historial`}
                  className="group inline-flex items-center gap-1 font-mono text-[11.5px] text-grayscale-10 transition-colors hover:text-grayscale-12"
                >
                  <span>Ver completa (</span>
                  <SlotNumber value={ficha.historial.length} />
                  <span>)</span>
                  <ArrowRightIcon
                    size={11}
                    className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              <Timeline eventos={ficha.historial} />
            </div>

            <div className="px-4 py-2 text-[11px] text-grayscale-9">
              Línea de auditoría inmutable
            </div>
          </section>

          {/* Valoración de servicio CSAT y reincidencia (Tabla 14 / Sección 4.7) */}
          {esCerrada && (esCreadorEmpleado || valoracion) && (
            <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grayscale-3/80 pb-3 dark:border-grayscale-3/50">
                  <div>
                    <h2 className="text-[13px] font-semibold text-grayscale-12">
                      Valoración de la atención
                    </h2>
                    <p className="text-[11.5px] text-grayscale-9">
                      Califica el resultado técnico para el indicador de satisfacción (meta 80%).
                    </p>
                  </div>
                  {valoracion ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-grayscale-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-grayscale-12 dark:bg-white/[0.06]">
                      <StarIcon
                        size={12}
                        weight="fill"
                        className="text-amber-500"
                      />
                      <span>{valoracion.calificacion}/5</span>
                    </span>
                  ) : null}
                </div>

                {esCreadorEmpleado ? (
                  <form onSubmit={guardarValoracion} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([1, 2, 3, 4, 5] as const).map((estrella) => {
                        const activa =
                          estrella <= (calificacionHover ?? calificacionSel);
                        return (
                          <button
                            key={estrella}
                            type="button"
                            onMouseEnter={() => setCalificacionHover(estrella)}
                            onMouseLeave={() => setCalificacionHover(null)}
                            onClick={() => setCalificacionSel(estrella)}
                            aria-label={`${estrella} ${estrella === 1 ? "estrella" : "estrellas"}`}
                            className="cursor-pointer rounded-lg p-1.5 transition-transform duration-150 ease-[var(--ease-out-soft)] hover:scale-110 active:scale-95"
                          >
                            <StarIcon
                              size={22}
                              weight={activa ? "fill" : "regular"}
                              className={cn(
                                "transition-colors duration-150",
                                activa
                                  ? "text-amber-500"
                                  : "text-grayscale-6 dark:text-grayscale-7",
                              )}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 font-mono text-[11px] text-grayscale-9">
                        {calificacionSel >= 4
                          ? "Satisfactoria"
                          : calificacionSel === 3
                            ? "Aceptable"
                            : "Por mejorar"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={comentarioVal}
                        onChange={(e) => setComentarioVal(e.target.value)}
                        placeholder="Comentario breve opcional sobre el trabajo realizado..."
                        className="flex-1 rounded-xl border border-grayscale-4/80 bg-grayscale-1 px-3 py-2 text-[12.5px] text-grayscale-12 placeholder:text-grayscale-8 focus:border-grayscale-8 focus:outline-none dark:border-white/[0.12] dark:bg-[#171715]"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="h-9 px-3.5 text-[12px]"
                      >
                        {guardadoOk
                          ? "Guardada"
                          : valoracion
                            ? "Actualizar"
                            : "Enviar valoración"}
                      </Button>
                    </div>
                  </form>
                ) : valoracion ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {([1, 2, 3, 4, 5] as const).map((estrella) => (
                        <StarIcon
                          key={estrella}
                          size={18}
                          weight={
                            estrella <= valoracion.calificacion
                              ? "fill"
                              : "regular"
                          }
                          className={
                            estrella <= valoracion.calificacion
                              ? "text-amber-500"
                              : "text-grayscale-6"
                          }
                        />
                      ))}
                    </div>
                    {valoracion.comentario ? (
                      <p className="text-[12.5px] text-grayscale-10">
                        “{valoracion.comentario}”
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {esCreadorEmpleado ? (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-grayscale-9">
                  <span>¿El problema volvió a presentarse?</span>
                  <Link
                    href={`/solicitudes/nueva?reincidencia=${encodeURIComponent(ficha.id)}&titulo=${encodeURIComponent(ficha.titulo)}&ubicacion=${encodeURIComponent(ficha.ubicacion)}`}
                    className="inline-flex items-center gap-1 font-medium text-grayscale-11 transition-colors hover:text-grayscale-12"
                  >
                    <ArrowCounterClockwiseIcon size={12} />
                    <span>Reportar reincidencia</span>
                  </Link>
                </div>
              ) : (
                <div className="px-4 py-2 text-[11px] text-grayscale-9">
                  Valoración registrada por el solicitante
                </div>
              )}
            </section>
          )}
        </div>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: `Ficha ${id}`,
          subtitle: solicitud
            ? `${solicitud.estado} | ${solicitud.historial.length} movimientos`
            : undefined,
        }}
        primaryLabel={esTecnico && !esCerrada ? "Atender solicitud" : undefined}
        primaryHref={
          esTecnico && !esCerrada
            ? `/mantenimiento/${id}/atencion`
            : undefined
        }
        shortcuts={[
          { key: "Esc", label: "Volver a la bandeja" },
          { key: "H", label: "Ver historial" },
          ...(esTecnico && !esCerrada
            ? [{ key: "A", label: "Atender" }]
            : []),
        ]}
      />
    </div>
  );
}
