"use client";

import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  GlobeIcon,
  IdentificationBadgeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  TagIcon,
  UserIcon,
  UsersThreeIcon,
  WrenchIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrioridadChip } from "@/components/ui/PrioridadChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAtajos } from "@/hooks/useAtajos";
import { cn } from "@/helpers/classname-helper";
import {
  getBandejaMantenimiento,
  getSolicitudesPorCreador,
  getUsuarioActual,
  getUsuarios,
} from "@/lib/mantenimiento/store";
import type { Estado, Rol, Solicitud, Usuario } from "@/lib/mantenimiento/types";

type TabPerfil = "resumen" | "actividad";
type FiltroEstadoActividad = "TODAS" | Estado;

interface PerfilExtendido {
  resumen: string;
  ubicacion: string;
  extension: string;
  idiomas: string;
  etiquetas: string[];
}

const PERFILES_POR_ROL: Record<Rol, PerfilExtendido> = {
  EMPLEADO: {
    resumen:
      "Responsable de reportar incidencias operativas y verificar la calidad de cierre en laboratorio y áreas administrativas.",
    ubicacion: "Edificio B | Piso 2",
    extension: "Ext. 204",
    idiomas: "Español | Inglés",
    etiquetas: [
      "Control de calidad",
      "Seguridad en planta",
      "Reportes preventivos",
      "Validación de cierre",
    ],
  },
  TECNICO: {
    resumen:
      "Especialista encargado del diagnóstico en sitio, atención de órdenes correctivas, registro de evidencia técnica y cumplimiento de SLA.",
    ubicacion: "Taller Central | Planta 1",
    extension: "Ext. 118",
    idiomas: "Español",
    etiquetas: [
      "Climatización HVAC",
      "Instalaciones eléctricas",
      "Mantenimiento preventivo",
      "Evidencia técnica",
    ],
  },
  JEFATURA: {
    resumen:
      "Supervisión operativa de la mesa de mantenimiento, seguimiento de metas SLA (≤ 48 h), satisfacción interna y reducción de papel ODS 12.5.",
    ubicacion: "Dirección Operativa | Piso 3",
    extension: "Ext. 102",
    idiomas: "Español | Inglés",
    etiquetas: [
      "Gestión SLA 48h",
      "Indicadores ODS 12.5",
      "Control de calidad",
      "Asignación de recursos",
    ],
  },
};

const ETIQUETA_ROL: Record<Rol, string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico",
  JEFATURA: "Jefatura",
};

function nombreLimpio(nombre: string): string {
  return nombre.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function storageKey(usuarioId: string): string {
  return `perfil-usuario:${usuarioId}`;
}

function cargarPerfilGuardado(usuario: Usuario): PerfilExtendido {
  const base = PERFILES_POR_ROL[usuario.rol];
  try {
    const raw = window.localStorage.getItem(storageKey(usuario.id));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PerfilExtendido>;
    return {
      resumen: parsed.resumen ?? base.resumen,
      ubicacion: parsed.ubicacion ?? base.ubicacion,
      extension: parsed.extension ?? base.extension,
      idiomas: parsed.idiomas ?? base.idiomas,
      etiquetas:
        Array.isArray(parsed.etiquetas) && parsed.etiquetas.length > 0
          ? parsed.etiquetas
          : base.etiquetas,
    };
  } catch {
    return base;
  }
}

function NodoJerarquia({
  miembro,
  esActual,
  resaltado,
  atenuado,
  etiquetaNivel,
  variante = "row",
  avatarSize = 36,
  onHover,
}: {
  miembro: Usuario;
  esActual: boolean;
  resaltado: boolean;
  atenuado: boolean;
  etiquetaNivel?: string;
  variante?: "row" | "compact";
  avatarSize?: number;
  onHover: (id: string | null) => void;
}) {
  const esCompacto = variante === "compact";

  return (
    <div
      className={cn(
        "group relative w-full transition-opacity duration-160 ease-[cubic-bezier(0.23,1,0.32,1)]",
        atenuado ? "opacity-55" : "opacity-100",
      )}
      onMouseEnter={() => onHover(miembro.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(miembro.id)}
      onBlur={() => onHover(null)}
    >
      <div
        className={cn(
          "hover-lift relative flex border transition-[transform,border-color,background-color,box-shadow] duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.985]",
          esCompacto
            ? "h-full flex-col justify-between rounded-xl p-2.5"
            : "items-center gap-3 rounded-2xl p-2.5 sm:p-3",
          esActual || resaltado
            ? "border-grayscale-12/25 bg-grayscale-2/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/25 dark:bg-white/[0.05] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            : "border-grayscale-3/80 bg-grayscale-1/70 hover:border-grayscale-5 hover:bg-grayscale-1 hover:shadow-2xs dark:border-white/[0.10] dark:bg-[#161614] dark:hover:border-white/[0.20]",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            esCompacto ? "justify-between gap-1.5" : "shrink-0",
          )}
        >
          <div
            skullet-block=""
            className="relative shrink-0 overflow-hidden rounded-full"
          >
            <UserAvatar
              userId={miembro.id}
              name={miembro.nombre}
              size={avatarSize}
              className={cn(
                "transition-transform duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105",
                esActual || resaltado
                  ? "ring-2 ring-grayscale-12/40 dark:ring-white/40"
                  : "ring-1 ring-grayscale-3 dark:ring-white/15",
              )}
            />
          </div>

          {esCompacto && esActual ? (
            <span className="rounded-full border border-grayscale-12/15 bg-grayscale-12/10 px-1.5 py-0.5 font-mono text-[8.5px] font-semibold text-grayscale-12 dark:border-white/20 dark:bg-white/10 dark:text-grayscale-1">
              Tú
            </span>
          ) : null}
        </div>

        <div className={cn("min-w-0", esCompacto ? "mt-2" : "flex-1")}>
          {esCompacto ? (
            <>
              <p className="truncate text-[11.5px] font-semibold text-grayscale-12">
                {nombreLimpio(miembro.nombre)}
              </p>
              <p className="truncate font-mono text-[9.5px] text-grayscale-9">
                {miembro.cargo}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-1.5">
                <p className="truncate text-[12.5px] font-semibold text-grayscale-12 sm:text-[13px]">
                  {nombreLimpio(miembro.nombre)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {esActual ? (
                    <span className="rounded-full border border-grayscale-12/15 bg-grayscale-12/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-grayscale-12 dark:border-white/20 dark:bg-white/10 dark:text-grayscale-1">
                      Tú
                    </span>
                  ) : null}
                  {etiquetaNivel ? (
                    <span className="rounded-full border border-grayscale-3/60 bg-grayscale-2 px-2 py-0.5 font-mono text-[9px] text-grayscale-10 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-grayscale-8">
                      {etiquetaNivel}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="truncate text-[11px] font-medium text-grayscale-10">
                {miembro.cargo}
              </p>
              <p className="truncate font-mono text-[9.5px] text-grayscale-8">
                {miembro.departamento}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => getUsuarios());
  const [tab, setTab] = useState<TabPerfil>("resumen");
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoActividad>("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const [perfil, setPerfil] = useState<PerfilExtendido>(
    PERFILES_POR_ROL[usuario.rol],
  );
  const [solicitudesRelacionadas, setSolicitudesRelacionadas] = useState<
    Solicitud[]
  >([]);

  useAtajos(
    {
      escape: () => {
        if (editando) {
          cancelarEdicion();
        } else {
          router.push("/");
        }
      },
    },
    true,
  );

  useEffect(() => {
    const cargar = () => {
      const actual = getUsuarioActual();
      setUsuario(actual);
      setUsuarios(getUsuarios());
      setEditando(false);
      setPerfil(cargarPerfilGuardado(actual));

      const relacionadas =
        actual.rol === "EMPLEADO"
          ? getSolicitudesPorCreador(actual.id)
          : getBandejaMantenimiento("TODAS");
      setSolicitudesRelacionadas(relacionadas);
      setCargando(false);
    };

    cargar();
    window.addEventListener("usuario-cambiado", cargar);
    window.addEventListener("mantenimiento:actualizado", cargar);
    return () => {
      window.removeEventListener("usuario-cambiado", cargar);
      window.removeEventListener("mantenimiento:actualizado", cargar);
    };
  }, []);

  const conteosEstado = useMemo(() => {
    const conteo = {
      TODAS: solicitudesRelacionadas.length,
      REGISTRADA: 0,
      EN_PROCESO: 0,
      CERRADA: 0,
    };
    for (const sol of solicitudesRelacionadas) {
      if (sol.estado in conteo) {
        conteo[sol.estado]++;
      }
    }
    return conteo;
  }, [solicitudesRelacionadas]);

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return solicitudesRelacionadas.filter((sol) => {
      const pasaEstado =
        filtroEstado === "TODAS" || sol.estado === filtroEstado;
      if (!pasaEstado) return false;
      if (!q) return true;
      return (
        sol.id.toLowerCase().includes(q) ||
        sol.titulo.toLowerCase().includes(q) ||
        sol.ubicacion.toLowerCase().includes(q)
      );
    });
  }, [solicitudesRelacionadas, filtroEstado, busqueda]);

  const jerarquia = useMemo(() => {
    const orden: Record<Rol, number> = {
      JEFATURA: 0,
      TECNICO: 1,
      EMPLEADO: 2,
    };
    return [...usuarios].sort((a, b) => orden[a.rol] - orden[b.rol]);
  }, [usuarios]);

  function cancelarEdicion() {
    setPerfil(cargarPerfilGuardado(usuario));
    setEditando(false);
  }

  function guardarCambios() {
    try {
      window.localStorage.setItem(
        storageKey(usuario.id),
        JSON.stringify(perfil),
      );
    } catch {
      // Ignorar si el almacenamiento local no está disponible
    }
    setEditando(false);
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2000);
  }

  async function copiarCorreo() {
    try {
      await navigator.clipboard.writeText(usuario.correo);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Ignorar si el portapapeles no está disponible
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl 2xl:max-w-6xl flex-1 flex-col justify-between gap-6">
      <SkeletonContent
        id={`perfil-${usuario.id}`}
        loading={cargando}
        label="Cargando perfil"
      >
        <div className="flex flex-col gap-5">
        <PageHeader
          codigo="P01"
          eyebrow="Cuenta"
          titulo="Mi perfil"
          meta={
            <span className="font-mono text-[11px] text-grayscale-9">
              {ETIQUETA_ROL[usuario.rol]} | {usuario.departamento}
            </span>
          }
        />

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Columna principal */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            {/* Tarjeta cabecera con banner e identidad */}
            <section
              className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]"
              style={{ "--stagger": 0 } as CSSProperties}
            >
              <div className="overflow-hidden rounded-[1rem] border border-grayscale-3/60 bg-white shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b]">
                {/* Banner ilustrado */}
                <div
                  skullet-block=""
                  className="relative h-32 w-full overflow-hidden border-b border-grayscale-3/80 bg-emerald-50 sm:h-40 dark:border-white/[0.14] dark:bg-emerald-950/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/perfil-banner.jpg"
                    alt="Ilustración de campus operativo"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Identidad */}
                <div className="px-5 pb-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-end gap-3.5">
                      <div
                        skullet-block=""
                        className="-mt-10 relative flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-grayscale-2 shadow-xs dark:border-[#121211] dark:bg-grayscale-3 overflow-hidden"
                      >
                        <UserAvatar
                          userId={usuario.id}
                          name={usuario.nombre}
                          size={80}
                        />
                      </div>
                      <div className="pt-2">
                        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-grayscale-12">
                          {nombreLimpio(usuario.nombre)}
                        </h2>
                        <p className="text-[12.5px] text-grayscale-9">
                          {usuario.cargo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editando ? (
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12.5px] font-medium text-grayscale-10 transition-[transform,background-color,border-color,color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-grayscale-2 active:scale-[0.97] dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                        >
                          <XIcon size={13} />
                          Cancelar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          editando ? guardarCambios() : setEditando(true)
                        }
                        className={cn(
                          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-[12.5px] font-medium transition-[transform,background-color,border-color,color] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
                          editando
                            ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                            : "border-grayscale-4 bg-grayscale-1 text-grayscale-11 hover:bg-grayscale-2 dark:border-white/[0.12] dark:bg-white/[0.04]",
                        )}
                      >
                        {editando ? (
                          <>
                            <CheckIcon size={13} weight="bold" />
                            Guardar perfil
                          </>
                        ) : (
                          <>
                            <PencilSimpleIcon size={13} />
                            {guardado ? "Guardado" : "Editar perfil"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-grayscale-2 px-2.5 py-1 font-mono text-[10.5px] text-grayscale-10 dark:bg-white/[0.06]">
                      <MapPinIcon size={12} />
                      {perfil.ubicacion}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheckIcon size={12} />
                      {ETIQUETA_ROL[usuario.rol]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                <SegmentedControl<TabPerfil>
                  value={tab}
                  onChange={setTab}
                  ariaLabel="Secciones del perfil"
                  items={[
                    { id: "resumen", label: "Resumen" },
                    { id: "actividad", label: "Actividad" },
                  ]}
                />
                <span className="px-1 font-mono text-[10.5px] text-grayscale-9">
                  ID {usuario.id}
                </span>
              </div>
            </section>

            {/* Contenido según pestaña */}
            <div key={tab} className="tab-panel-enter flex flex-col gap-4">
              {tab === "resumen" && (
              <>
                <section
                  className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b]">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                        <UserIcon size={13} />
                      </span>
                      <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Resumen operativo
                      </h3>
                    </div>

                    {editando ? (
                      <textarea
                        rows={3}
                        value={perfil.resumen}
                        onChange={(e) =>
                          setPerfil((prev) => ({
                            ...prev,
                            resumen: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-grayscale-4/80 bg-grayscale-1 px-3 py-2 text-[13px] text-grayscale-12 focus:border-grayscale-8 focus:outline-none dark:border-white/[0.12] dark:bg-[#171715]"
                      />
                    ) : (
                      <p className="text-[13px] leading-relaxed text-grayscale-10">
                        {perfil.resumen}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                    <span className="truncate font-medium">
                      {editando ? "Edición de resumen activa" : `Rol ${ETIQUETA_ROL[usuario.rol]}`}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-grayscale-8">
                      {guardado ? "Guardado" : "Perfil operativo"}
                    </span>
                  </div>
                </section>

                <section
                  className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b]">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                        <TagIcon size={13} />
                      </span>
                      <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Áreas de especialidad
                      </h3>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {perfil.etiquetas.map((etiqueta, idx) => (
                        <div
                          key={etiqueta}
                          className="surface-soft flex items-center gap-2.5 rounded-xl px-3 py-2"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            <CheckIcon size={11} weight="bold" />
                          </span>
                          <span className="truncate text-[12px] font-medium text-grayscale-11">
                            {etiqueta}
                          </span>
                          <span className="ml-auto font-mono text-[10px] text-grayscale-8">
                            0{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                    <span className="truncate font-medium">
                      Competencias asignadas
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-grayscale-8">
                      {perfil.etiquetas.length} áreas
                    </span>
                  </div>
                </section>
              </>
            )}

            {tab === "actividad" && (
              <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
                <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b] space-y-3.5">
                  {/* Cabecera y controles de filtro */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Historial de actividad
                      </h3>
                      <p className="text-[11px] text-grayscale-9">
                        Solicitudes vinculadas y su estado operativo
                      </p>
                    </div>

                    {/* Barra de búsqueda rápida */}
                    <div className="relative w-full sm:w-56">
                      <MagnifyingGlassIcon
                        size={13}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-grayscale-8"
                      />
                      <input
                        type="text"
                        placeholder="Buscar por folio o título..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="h-8 w-full rounded-lg border border-grayscale-3/80 bg-grayscale-1 pl-8 pr-7 text-[11.5px] text-grayscale-12 placeholder:text-grayscale-8 transition-[border-color,background-color] duration-150 focus:border-grayscale-6 focus:bg-white focus:outline-none dark:border-white/[0.10] dark:bg-[#161614] dark:focus:border-white/20 dark:focus:bg-[#191917]"
                      />
                      {busqueda ? (
                        <button
                          type="button"
                          onClick={() => setBusqueda("")}
                          aria-label="Limpiar búsqueda"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-grayscale-8 hover:text-grayscale-11"
                        >
                          <XIcon size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Filtros minimalistas sin contenedor */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-grayscale-3/60 pb-3 dark:border-white/[0.08]">
                    {(
                      [
                        { id: "TODAS", label: "Todas", icon: SquaresFourIcon },
                        { id: "REGISTRADA", label: "Registradas", icon: ClockIcon },
                        { id: "EN_PROCESO", label: "En proceso", icon: WrenchIcon },
                        { id: "CERRADA", label: "Cerradas", icon: CheckCircleIcon },
                      ] as const
                    ).map((f) => {
                      const activo = filtroEstado === f.id;
                      const count = conteosEstado[f.id];
                      const Icono = f.icon;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltroEstado(f.id)}
                          className={cn(
                            "group relative inline-flex cursor-pointer items-center gap-1.5 bg-transparent py-0.5 text-[11.5px] transition-[color,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
                            activo
                              ? "font-semibold text-grayscale-12 dark:text-white"
                              : "font-medium text-grayscale-8 hover:text-grayscale-11 dark:text-grayscale-8 dark:hover:text-grayscale-11",
                          )}
                        >
                          <Icono
                            size={13}
                            weight={activo ? "fill" : "regular"}
                            className={cn(
                              "transition-transform duration-150 group-hover:scale-110",
                              activo
                                ? "text-grayscale-12 dark:text-white"
                                : "text-grayscale-8 group-hover:text-grayscale-11",
                            )}
                          />
                          <span>{f.label}</span>
                          <span
                            className={cn(
                              "font-mono text-[10px] tabular-nums",
                              activo ? "opacity-80" : "opacity-55",
                            )}
                          >
                            {count}
                          </span>
                          {activo ? (
                            <span
                              aria-hidden="true"
                              skullet-ignore=""
                              className="absolute inset-x-0 -bottom-[13px] h-[1.5px] rounded-full bg-grayscale-12 dark:bg-white"
                            />
                          ) : null}
                        </button>
                      );
                    })}

                    <span className="ml-auto font-mono text-[10px] tabular-nums text-grayscale-8 whitespace-nowrap">
                      {solicitudesFiltradas.length} de {solicitudesRelacionadas.length}
                    </span>
                  </div>

                  {/* Tabla interactiva sin saltos de línea */}
                  {solicitudesFiltradas.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-[12.5px] text-grayscale-9">
                        {solicitudesRelacionadas.length === 0
                          ? "No hay solicitudes vinculadas a esta cuenta."
                          : "No se encontraron solicitudes con los filtros aplicados."}
                      </p>
                    </div>
                  ) : (
                    <div className="-mx-1 overflow-x-auto sm:mx-0">
                      <table className="w-full border-collapse text-left text-[12px]">
                        <thead>
                          <tr className="border-b border-grayscale-3/70 font-mono text-[10px] uppercase tracking-wider text-grayscale-8 dark:border-white/[0.08]">
                            <th className="whitespace-nowrap pb-2.5 pl-2 pr-3 font-medium">
                              Folio / Asunto
                            </th>
                            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium sm:table-cell">
                              Ubicación
                            </th>
                            <th className="whitespace-nowrap pb-2.5 pr-3 font-medium">
                              Prioridad
                            </th>
                            <th className="whitespace-nowrap pb-2.5 pr-3 font-medium">
                              Estado
                            </th>
                            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium md:table-cell">
                              Fecha
                            </th>
                            <th className="whitespace-nowrap pb-2.5 pr-2 text-right font-medium">
                              Detalle
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-grayscale-3/60 dark:divide-white/[0.06]">
                          {solicitudesFiltradas.map((sol) => (
                            <tr
                              key={sol.id}
                              className="group transition-[background-color] duration-150 hover:bg-grayscale-2/60 dark:hover:bg-white/[0.03]"
                            >
                              {/* Folio y título en una sola línea limpia */}
                              <td className="max-w-[200px] py-2.5 pl-2 pr-3 align-middle sm:max-w-[230px]">
                                <Link
                                  href={`/solicitudes/${sol.id}`}
                                  className="flex min-w-0 flex-col focus:outline-none"
                                >
                                  <span className="truncate font-mono text-[10.5px] font-semibold text-grayscale-10 group-hover:text-grayscale-12 dark:text-grayscale-8 dark:group-hover:text-white">
                                    {sol.id}
                                  </span>
                                  <span className="truncate text-[12px] font-medium text-grayscale-12 dark:text-grayscale-2">
                                    {sol.titulo}
                                  </span>
                                </Link>
                              </td>

                              {/* Ubicación */}
                              <td className="hidden max-w-[140px] py-2.5 pr-3 align-middle text-grayscale-10 dark:text-grayscale-8 sm:table-cell">
                                <span className="block truncate font-mono text-[11px]">
                                  {sol.ubicacion}
                                </span>
                              </td>

                              {/* Prioridad */}
                              <td className="whitespace-nowrap py-2.5 pr-3 align-middle">
                                <PrioridadChip
                                  prioridad={sol.prioridad}
                                  size="sm"
                                />
                              </td>

                              {/* Estado */}
                              <td className="whitespace-nowrap py-2.5 pr-3 align-middle">
                                <EstadoBadge estado={sol.estado} size="sm" />
                              </td>

                              {/* Fecha */}
                              <td className="hidden whitespace-nowrap py-2.5 pr-3 align-middle font-mono text-[10.5px] text-grayscale-9 dark:text-grayscale-8 md:table-cell">
                                <TiempoRelativo fecha={sol.creadaEn} />
                              </td>

                              {/* Acción / Enlace */}
                              <td className="whitespace-nowrap py-2.5 pr-2 text-right align-middle">
                                <Link
                                  href={`/solicitudes/${sol.id}`}
                                  aria-label={`Ver detalle de solicitud ${sol.id}`}
                                  className="inline-flex size-7 items-center justify-center rounded-lg border border-transparent text-grayscale-9 transition-[transform,background-color,border-color,color] duration-150 hover:border-grayscale-3 hover:bg-grayscale-1 hover:text-grayscale-12 active:scale-[0.95] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.06] dark:hover:text-white"
                                >
                                  <ArrowSquareOutIcon size={14} />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                  <span className="truncate font-medium">
                    {solicitudesFiltradas.length} de {solicitudesRelacionadas.length} solicitudes
                  </span>
                  <Link
                    href={usuario.rol === "EMPLEADO" ? "/mis-solicitudes" : "/mantenimiento"}
                    className="group inline-flex shrink-0 items-center gap-1 font-mono text-[10.5px] font-medium text-grayscale-11 transition-colors duration-150 hover:text-grayscale-12 dark:hover:text-white"
                  >
                    {usuario.rol === "EMPLEADO" ? "Mis solicitudes" : "Ir a bandeja"}
                    <ArrowRightIcon
                      size={11}
                      className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </section>
            )}
            </div>
          </div>

          {/* Columna lateral derecha */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Jerarquía y Estructura Organizacional */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
              <div className="relative overflow-hidden rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b]">
                {/* Patrón de fondo técnico sutil */}
                <div
                  aria-hidden="true"
                  skullet-ignore=""
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px]"
                />

                {/* Header de la sección */}
                <div className="relative z-10 mb-4 flex items-center justify-between border-b border-grayscale-3/60 pb-3 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                      <UsersThreeIcon size={13} />
                    </span>
                    <div>
                      <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Estructura del área
                      </h3>
                      <p className="text-[10.5px] text-grayscale-9">
                        Cadena de mando operativa
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-grayscale-2 px-2 py-0.5 font-mono text-[10px] text-grayscale-9 dark:bg-white/[0.06]">
                    {jerarquia.length}{" "}
                    {jerarquia.length === 1 ? "miembro" : "miembros"}
                  </span>
                </div>

                {/* Diagrama jerárquico interactivo con flujo de líneas */}
                {(() => {
                  const lider = jerarquia.find((u) => u.rol === "JEFATURA");
                  const tecnicos = jerarquia.filter((u) => u.rol === "TECNICO");
                  const empleados = jerarquia.filter((u) => u.rol === "EMPLEADO");
                  const hoverUsuario = hoverId
                    ? jerarquia.find((u) => u.id === hoverId)
                    : null;

                  const conector1Activo = Boolean(hoverUsuario);
                  const ramaIzqActiva =
                    hoverUsuario?.rol === "JEFATURA" ||
                    hoverUsuario?.rol === "TECNICO" ||
                    (empleados[0] != null && hoverId === empleados[0].id);
                  const ramaDerActiva =
                    hoverUsuario?.rol === "JEFATURA" ||
                    hoverUsuario?.rol === "TECNICO" ||
                    (empleados[1] != null && hoverId === empleados[1].id);

                  return (
                    <div className="relative z-10 flex flex-col items-center">
                      {lider ? (
                        <NodoJerarquia
                          miembro={lider}
                          esActual={lider.id === usuario.id}
                          resaltado={Boolean(hoverUsuario)}
                          atenuado={false}
                          etiquetaNivel="Dirección"
                          avatarSize={40}
                          onHover={setHoverId}
                        />
                      ) : null}

                      {/* Conector dinámico Animado Nivel 1 a Nivel 2 */}
                      <div
                        aria-hidden="true"
                        skullet-ignore=""
                        className="pointer-events-none relative flex h-8 w-full select-none items-center justify-center"
                      >
                        <svg
                          skullet-ignore=""
                          className="h-full w-full overflow-visible"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            className="stroke-grayscale-3/70 stroke-[1.5] dark:stroke-white/[0.08]"
                          />
                          <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            className={cn(
                              "animate-line-flow stroke-[2] transition-opacity duration-180",
                              conector1Activo
                                ? "stroke-grayscale-12 opacity-100 dark:stroke-white"
                                : "stroke-grayscale-10 opacity-75 dark:stroke-white/70",
                            )}
                          />
                        </svg>
                        <div
                          skullet-ignore=""
                          className="animate-pulse-node absolute size-2 rounded-full border border-white bg-grayscale-10 shadow-2xs dark:border-[#121211] dark:bg-white"
                        />
                      </div>

                      {tecnicos.length > 0 ? (
                        <div className="relative z-10 w-full space-y-2">
                          {tecnicos.map((tecnico) => (
                            <NodoJerarquia
                              key={tecnico.id}
                              miembro={tecnico}
                              esActual={tecnico.id === usuario.id}
                              resaltado={Boolean(hoverUsuario)}
                              atenuado={false}
                              etiquetaNivel="Técnico"
                              avatarSize={36}
                              onHover={setHoverId}
                            />
                          ))}
                        </div>
                      ) : null}

                      {/* Bifurcación en 2 ramas con curvas Bézier y recorrido continuo */}
                      {empleados.length > 0 ? (
                        <>
                          <div
                            aria-hidden="true"
                            skullet-ignore=""
                            className="pointer-events-none relative h-9 w-full select-none"
                          >
                            <svg
                              skullet-ignore=""
                              className="h-full w-full overflow-visible"
                              viewBox="0 0 320 36"
                              preserveAspectRatio="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M 160 0 C 160 18, 80 18, 80 36"
                                fill="none"
                                vectorEffect="non-scaling-stroke"
                                strokeWidth="1.5"
                                className="stroke-grayscale-3/70 dark:stroke-white/[0.08]"
                              />
                              <path
                                d="M 160 0 C 160 18, 240 18, 240 36"
                                fill="none"
                                vectorEffect="non-scaling-stroke"
                                strokeWidth="1.5"
                                className="stroke-grayscale-3/70 dark:stroke-white/[0.08]"
                              />

                              <path
                                d="M 160 0 C 160 18, 80 18, 80 36"
                                fill="none"
                                vectorEffect="non-scaling-stroke"
                                strokeWidth="2"
                                className={cn(
                                  "animate-line-flow transition-opacity duration-180",
                                  ramaIzqActiva
                                    ? "stroke-grayscale-12 opacity-100 dark:stroke-white"
                                    : hoverUsuario
                                      ? "stroke-grayscale-8 opacity-30 dark:stroke-white/30"
                                      : "stroke-grayscale-10 opacity-75 dark:stroke-white/70",
                                )}
                              />
                              <path
                                d="M 160 0 C 160 18, 240 18, 240 36"
                                fill="none"
                                vectorEffect="non-scaling-stroke"
                                strokeWidth="2"
                                className={cn(
                                  "animate-line-flow transition-opacity duration-180",
                                  ramaDerActiva
                                    ? "stroke-grayscale-12 opacity-100 dark:stroke-white"
                                    : hoverUsuario
                                      ? "stroke-grayscale-8 opacity-30 dark:stroke-white/30"
                                      : "stroke-grayscale-10 opacity-75 dark:stroke-white/70",
                                )}
                              />
                            </svg>

                            <div
                              skullet-ignore=""
                              className="animate-pulse-node absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full border border-white bg-grayscale-10 shadow-2xs dark:border-[#121211] dark:bg-white"
                            />
                            <div
                              skullet-ignore=""
                              className="absolute bottom-0 left-1/4 size-1.5 -translate-x-1/2 rounded-full bg-grayscale-6 dark:bg-white/40"
                            />
                            <div
                              skullet-ignore=""
                              className="absolute bottom-0 left-3/4 size-1.5 -translate-x-1/2 rounded-full bg-grayscale-6 dark:bg-white/40"
                            />
                          </div>

                          <div className="relative z-10 grid w-full grid-cols-2 gap-2">
                            {empleados.map((empleado) => {
                              const enRuta =
                                hoverUsuario?.rol === "JEFATURA" ||
                                hoverUsuario?.rol === "TECNICO" ||
                                hoverId === empleado.id;

                              return (
                                <NodoJerarquia
                                  key={empleado.id}
                                  miembro={empleado}
                                  esActual={empleado.id === usuario.id}
                                  resaltado={Boolean(hoverUsuario && enRuta)}
                                  atenuado={Boolean(hoverUsuario && !enRuta)}
                                  variante="compact"
                                  avatarSize={30}
                                  onHover={setHoverId}
                                />
                              );
                            })}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                <span className="truncate font-medium">
                  {hoverId
                    ? nombreLimpio(
                        jerarquia.find((u) => u.id === hoverId)?.nombre ?? "",
                      )
                    : "Cadena de mando operativa"}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-grayscale-8">
                  {jerarquia.length} {jerarquia.length === 1 ? "nivel" : "integrantes"}
                </span>
              </div>
            </section>

            {/* Detalles adicionales */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/80 bg-[#f5f4f2] p-1 shadow-2xs dark:border-white/[0.08] dark:bg-[#141413]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.07] dark:bg-[#1c1c1b]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                    <IdentificationBadgeIcon size={13} />
                  </span>
                  <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                    Detalles adicionales
                  </h3>
                </div>

                <div className="space-y-3 text-[12px]">
                  <div className="flex items-start gap-2.5">
                    <EnvelopeSimpleIcon
                      size={15}
                      className="mt-0.5 shrink-0 text-grayscale-8"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Correo
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={`mailto:${usuario.correo}`}
                          className="truncate font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {usuario.correo}
                        </a>
                        <button
                          type="button"
                          onClick={copiarCorreo}
                          aria-label="Copiar correo"
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-grayscale-3/80 bg-grayscale-1 px-1.5 py-0.5 font-mono text-[9.5px] text-grayscale-10 transition-[transform,background-color] duration-150 hover:bg-grayscale-2 active:scale-[0.96] dark:border-white/[0.10] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                        >
                          {copiado ? (
                            <>
                              <CheckIcon size={10} weight="bold" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <CopyIcon size={10} />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BuildingsIcon
                      size={15}
                      className="mt-0.5 shrink-0 text-grayscale-8"
                    />
                    <div className="min-w-0">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Departamento
                      </span>
                      <span className="font-medium text-grayscale-12">
                        {usuario.departamento}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BriefcaseIcon
                      size={15}
                      className="mt-0.5 shrink-0 text-grayscale-8"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Ubicación y extensión
                      </span>
                      {editando ? (
                        <div className="mt-1 flex gap-1.5">
                          <input
                            type="text"
                            value={perfil.ubicacion}
                            onChange={(e) =>
                              setPerfil((prev) => ({
                                ...prev,
                                ubicacion: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-grayscale-4/80 bg-grayscale-1 px-2 py-1 text-[11.5px] text-grayscale-12 dark:border-white/[0.12] dark:bg-[#171715]"
                          />
                          <input
                            type="text"
                            value={perfil.extension}
                            onChange={(e) =>
                              setPerfil((prev) => ({
                                ...prev,
                                extension: e.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-grayscale-4/80 bg-grayscale-1 px-2 py-1 text-[11.5px] text-grayscale-12 dark:border-white/[0.12] dark:bg-[#171715]"
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-grayscale-12">
                          {perfil.ubicacion} | {perfil.extension}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <GlobeIcon
                      size={15}
                      className="mt-0.5 shrink-0 text-grayscale-8"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Idiomas
                      </span>
                      {editando ? (
                        <input
                          type="text"
                          value={perfil.idiomas}
                          onChange={(e) =>
                            setPerfil((prev) => ({
                              ...prev,
                              idiomas: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-grayscale-4/80 bg-grayscale-1 px-2 py-1 text-[11.5px] text-grayscale-12 dark:border-white/[0.12] dark:bg-[#171715]"
                        />
                      ) : (
                        <span className="font-medium text-grayscale-12">
                          {perfil.idiomas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
                <span className="truncate font-medium">Contacto interno</span>
                <span className="shrink-0 font-mono text-[10px] text-grayscale-8">
                  {perfil.extension}
                </span>
              </div>
            </section>
          </div>
        </div>
        </div>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: nombreLimpio(usuario.nombre),
          subtitle: `${ETIQUETA_ROL[usuario.rol]} | ${usuario.departamento}`,
        }}
        primaryLabel="Ir al panel"
        primaryHref="/"
        shortcuts={[{ key: "Esc", label: "Volver al panel" }]}
      />
    </div>
  );
}
