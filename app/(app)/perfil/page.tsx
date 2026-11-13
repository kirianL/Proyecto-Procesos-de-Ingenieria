"use client";

import {
  BriefcaseIcon,
  BuildingsIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  GlobeIcon,
  IdentificationBadgeIcon,
  MapPinIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  TagIcon,
  UserIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { EstadoBadge } from "@/components/mantenimiento/EstadoBadge";
import { PageHeader } from "@/components/ui/PageHeader";
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
import type { Rol, Solicitud, Usuario } from "@/lib/mantenimiento/types";

type TabPerfil = "resumen" | "actividad" | "permisos";

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

const PERMISOS_POR_ROL: Record<
  Rol,
  { titulo: string; detalle: string; activo: boolean }[]
> = {
  EMPLEADO: [
    {
      titulo: "Registrar solicitudes",
      detalle: "Crear reportes con prioridad y evidencia fotográfica.",
      activo: true,
    },
    {
      titulo: "Consultar mis solicitudes",
      detalle: "Seguimiento en tiempo real de sus propios folios y CSAT.",
      activo: true,
    },
    {
      titulo: "Atender bandeja técnica",
      detalle: "Requiere rol Técnico o Jefatura.",
      activo: false,
    },
    {
      titulo: "Consultar indicadores",
      detalle: "Requiere rol Jefatura.",
      activo: false,
    },
  ],
  TECNICO: [
    {
      titulo: "Bandeja técnica completa",
      detalle: "Visualizar todas las solicitudes activas y filtradas.",
      activo: true,
    },
    {
      titulo: "Iniciar atención y cerrar",
      detalle: "Transicionar estados con nota obligatoria y evidencia.",
      activo: true,
    },
    {
      titulo: "Trazabilidad de eventos",
      detalle: "Acceso íntegro al historial cronológico de cada folio.",
      activo: true,
    },
    {
      titulo: "Panel ejecutivo de indicadores",
      detalle: "Requiere rol Jefatura.",
      activo: false,
    },
  ],
  JEFATURA: [
    {
      titulo: "Supervisión de bandeja técnica",
      detalle: "Acceso de lectura y seguimiento sobre toda la cola.",
      activo: true,
    },
    {
      titulo: "Indicadores y metas ODS 12.5",
      detalle: "Acceso a métricas SLA, CSAT y exportación ejecutiva.",
      activo: true,
    },
    {
      titulo: "Auditoría de historial",
      detalle: "Revisión de responsables, notas y fechas atómicas.",
      activo: true,
    },
    {
      titulo: "Operación en sitio",
      detalle: "Delegada al personal técnico asignado.",
      activo: true,
    },
  ],
};

const ETIQUETA_ROL: Record<Rol, string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico",
  JEFATURA: "Jefatura",
};

function nombreLimpio(nombre: string): string {
  return nombre.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function inicialesDe(nombre: string): string {
  return nombreLimpio(nombre)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function storageKey(usuarioId: string): string {
  return `perfil-usuario:${usuarioId}`;
}

export default function PerfilPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => getUsuarios());
  const [tab, setTab] = useState<TabPerfil>("resumen");
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const [perfil, setPerfil] = useState<PerfilExtendido>(
    PERFILES_POR_ROL[usuario.rol],
  );
  const [solicitudesRelacionadas, setSolicitudesRelacionadas] = useState<
    Solicitud[]
  >([]);

  useAtajos({ escape: () => router.push("/") }, !editando);

  useEffect(() => {
    const cargar = () => {
      const actual = getUsuarioActual();
      setUsuario(actual);
      setUsuarios(getUsuarios());

      const base = PERFILES_POR_ROL[actual.rol];
      try {
        const raw = window.localStorage.getItem(storageKey(actual.id));
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PerfilExtendido>;
          setPerfil({
            resumen: parsed.resumen ?? base.resumen,
            ubicacion: parsed.ubicacion ?? base.ubicacion,
            extension: parsed.extension ?? base.extension,
            idiomas: parsed.idiomas ?? base.idiomas,
            etiquetas:
              Array.isArray(parsed.etiquetas) && parsed.etiquetas.length > 0
                ? parsed.etiquetas
                : base.etiquetas,
          });
        } else {
          setPerfil(base);
        }
      } catch {
        setPerfil(base);
      }

      const relacionadas =
        actual.rol === "EMPLEADO"
          ? getSolicitudesPorCreador(actual.id)
          : getBandejaMantenimiento("TODAS");
      setSolicitudesRelacionadas(relacionadas.slice(0, 5));
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

  const jerarquia = useMemo(() => {
    const orden: Record<Rol, number> = {
      JEFATURA: 0,
      TECNICO: 1,
      EMPLEADO: 2,
    };
    return [...usuarios].sort((a, b) => orden[a.rol] - orden[b.rol]);
  }, [usuarios]);

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
              className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]"
              style={{ "--stagger": 0 } as CSSProperties}
            >
              <div className="overflow-hidden rounded-[1rem] border border-grayscale-3/60 bg-white shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
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

                    <button
                      type="button"
                      onClick={() =>
                        editando ? guardarCambios() : setEditando(true)
                      }
                      className={cn(
                        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-[12.5px] font-medium transition-colors duration-150",
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
                    { id: "permisos", label: "Permisos" },
                  ]}
                />
                <span className="px-1 font-mono text-[10.5px] text-grayscale-9">
                  ID {usuario.id}
                </span>
              </div>
            </section>

            {/* Contenido según pestaña */}
            {tab === "resumen" && (
              <>
                <section
                  className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
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
                </section>

                <section
                  className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                          <TagIcon size={13} />
                        </span>
                        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                          Áreas de especialidad
                        </h3>
                      </div>
                      <span className="font-mono text-[10.5px] text-grayscale-9">
                        {perfil.etiquetas.length} áreas
                      </span>
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
                </section>
              </>
            )}

            {tab === "actividad" && (
              <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
                <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      Solicitudes recientes vinculadas
                    </h3>
                    <span className="font-mono text-[10.5px] text-grayscale-9">
                      {solicitudesRelacionadas.length} mostradas
                    </span>
                  </div>

                  {solicitudesRelacionadas.length === 0 ? (
                    <p className="py-4 text-[12.5px] text-grayscale-9">
                      No hay solicitudes asociadas actualmente.
                    </p>
                  ) : (
                    <div className="divide-y divide-grayscale-3/70 dark:divide-white/[0.06]">
                      {solicitudesRelacionadas.map((sol) => (
                        <Link
                          key={sol.id}
                          href={`/solicitudes/${sol.id}`}
                          className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-grayscale-1/70 px-2 -mx-2 rounded-lg dark:hover:bg-white/[0.03]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium text-grayscale-12">
                              {sol.titulo}
                            </p>
                            <p className="font-mono text-[10.5px] text-grayscale-9">
                              {sol.id} | {sol.ubicacion} |{" "}
                              <TiempoRelativo fecha={sol.creadaEn} />
                            </p>
                          </div>
                          <EstadoBadge estado={sol.estado} size="sm" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {tab === "permisos" && (
              <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
                <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211] space-y-2.5">
                  {PERMISOS_POR_ROL[usuario.rol].map((permiso) => (
                    <div
                      key={permiso.titulo}
                      className="surface-soft flex items-start justify-between gap-3 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-grayscale-12">
                          {permiso.titulo}
                        </p>
                        <p className="text-[11px] text-grayscale-9">
                          {permiso.detalle}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium",
                          permiso.activo
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-grayscale-3 text-grayscale-9 dark:bg-white/[0.06]",
                        )}
                      >
                        {permiso.activo ? "Habilitado" : "Restringido"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral derecha */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Jerarquía y Estructura Organizacional */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
              <div className="relative overflow-hidden rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
                {/* Patrón de fondo técnico sutil */}
                <div
                  aria-hidden="true"
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
                    4 miembros
                  </span>
                </div>

                {/* Diagrama jerárquico interactivo con flujo de partículas */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Nivel 1: Dirección / Jefatura */}
                  {(() => {
                    const lider = jerarquia.find((u) => u.rol === "JEFATURA");
                    if (!lider) return null;
                    const esActual = lider.id === usuario.id;

                    return (
                      <div className="group relative w-full transition-transform duration-200 hover:-translate-y-0.5">
                        <div
                          className={cn(
                            "relative flex items-center gap-3 rounded-2xl border p-3 transition-all duration-200",
                            esActual
                              ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_2px_12px_rgba(16,185,129,0.06)] dark:border-emerald-500/35 dark:bg-emerald-500/[0.05]"
                              : "border-grayscale-3/80 bg-grayscale-1/70 hover:border-grayscale-5 hover:bg-grayscale-1 hover:shadow-2xs dark:border-white/[0.10] dark:bg-[#161614] dark:hover:border-white/[0.20]",
                          )}
                        >
                          <div className="relative shrink-0">
                            <UserAvatar
                              userId={lider.id}
                              name={lider.nombre}
                              size={40}
                              className={cn(
                                "ring-2 transition-transform duration-200 group-hover:scale-105",
                                esActual
                                  ? "ring-emerald-500/50 dark:ring-emerald-400/50"
                                  : "ring-grayscale-3 dark:ring-white/15",
                              )}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="truncate text-[13px] font-semibold text-grayscale-12">
                                {nombreLimpio(lider.nombre)}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {esActual ? (
                                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                                    Tú
                                  </span>
                                ) : null}
                                <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[9px] text-grayscale-10 dark:bg-white/[0.06] dark:text-grayscale-8">
                                  Dirección
                                </span>
                              </div>
                            </div>
                            <p className="truncate text-[11px] font-medium text-grayscale-10">
                              {lider.cargo}
                            </p>
                            <p className="truncate font-mono text-[9.5px] text-grayscale-8">
                              {lider.departamento}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Conector dinámico Animado Nivel 1 a Nivel 2 (Flujo de puntitos) */}
                  <div className="relative flex h-8 w-full items-center justify-center">
                    <svg
                      className="h-full w-full overflow-visible"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Línea base estática */}
                      <line
                        x1="50%"
                        y1="0"
                        x2="50%"
                        y2="100%"
                        className="stroke-grayscale-3/70 stroke-[1.5] dark:stroke-white/[0.08]"
                      />
                      {/* Flujo animado de puntitos */}
                      <line
                        x1="50%"
                        y1="0"
                        x2="50%"
                        y2="100%"
                        className="animate-flow-dots stroke-grayscale-9 dark:stroke-emerald-400/90"
                        strokeWidth="2.5"
                      />
                    </svg>
                    {/* Nodo de enlace con pulso suave */}
                    <div className="animate-pulse-node absolute size-2 rounded-full border border-white bg-grayscale-9 shadow-2xs dark:border-[#121211] dark:bg-emerald-400" />
                  </div>

                  {/* Nivel 2: Supervisión Técnica */}
                  {(() => {
                    const tecnicos = jerarquia.filter((u) => u.rol === "TECNICO");
                    if (tecnicos.length === 0) return null;

                    return (
                      <div className="relative z-10 w-full space-y-2">
                        {tecnicos.map((tecnico) => {
                          const esActual = tecnico.id === usuario.id;
                          return (
                            <div
                              key={tecnico.id}
                              className="group relative transition-transform duration-200 hover:-translate-y-0.5"
                            >
                              <div
                                className={cn(
                                  "relative flex items-center gap-3 rounded-2xl border p-2.5 transition-all duration-200",
                                  esActual
                                    ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_2px_12px_rgba(16,185,129,0.06)] dark:border-emerald-500/35 dark:bg-emerald-500/[0.05]"
                                    : "border-grayscale-3/80 bg-grayscale-1/70 hover:border-grayscale-5 hover:bg-grayscale-1 hover:shadow-2xs dark:border-white/[0.10] dark:bg-[#161614] dark:hover:border-white/[0.20]",
                                )}
                              >
                                <div className="relative shrink-0">
                                  <UserAvatar
                                    userId={tecnico.id}
                                    name={tecnico.nombre}
                                    size={36}
                                    className={cn(
                                      "ring-2 transition-transform duration-200 group-hover:scale-105",
                                      esActual
                                        ? "ring-emerald-500/50 dark:ring-emerald-400/50"
                                        : "ring-grayscale-3 dark:ring-white/15",
                                    )}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <p className="truncate text-[12.5px] font-semibold text-grayscale-12">
                                      {nombreLimpio(tecnico.nombre)}
                                    </p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {esActual ? (
                                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                                          Tú
                                        </span>
                                      ) : null}
                                      <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[9px] text-grayscale-10 dark:bg-white/[0.06] dark:text-grayscale-8">
                                        Técnico
                                      </span>
                                    </div>
                                  </div>
                                  <p className="truncate text-[11px] font-medium text-grayscale-10">
                                    {tecnico.cargo}
                                  </p>
                                  <p className="truncate font-mono text-[9px] text-grayscale-8">
                                    {tecnico.departamento}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Bifurcación en 2 ramas con curvas Bézier y flujo de puntitos */}
                  <div className="relative h-9 w-full">
                    <svg
                      className="h-full w-full overflow-visible"
                      viewBox="0 0 100 36"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Pistas base estáticas */}
                      <path
                        d="M 50 0 C 50 16, 25 16, 25 36"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth="1.5"
                        className="stroke-grayscale-3/70 dark:stroke-white/[0.08]"
                      />
                      <path
                        d="M 50 0 C 50 16, 75 16, 75 36"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth="1.5"
                        className="stroke-grayscale-3/70 dark:stroke-white/[0.08]"
                      />

                      {/* Flujo animado de puntitos por ambas ramas */}
                      <path
                        d="M 50 0 C 50 16, 25 16, 25 36"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth="2.5"
                        className="animate-flow-dots stroke-grayscale-9 dark:stroke-emerald-400/90"
                      />
                      <path
                        d="M 50 0 C 50 16, 75 16, 75 36"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth="2.5"
                        className="animate-flow-dots stroke-grayscale-9 dark:stroke-emerald-400/90"
                      />
                    </svg>

                    {/* Nodo central de bifurcación */}
                    <div className="animate-pulse-node absolute left-1/2 top-0 -translate-x-1/2 size-2 rounded-full border border-white bg-grayscale-9 shadow-2xs dark:border-[#121211] dark:bg-emerald-400" />
                  </div>

                  {/* Nivel 3: Base Operativa en 2 Columnas Interactivas */}
                  {(() => {
                    const empleados = jerarquia.filter((u) => u.rol === "EMPLEADO");
                    if (empleados.length === 0) return null;

                    return (
                      <div className="relative z-10 grid w-full grid-cols-2 gap-2">
                        {empleados.map((empleado) => {
                          const esActual = empleado.id === usuario.id;
                          return (
                            <div
                              key={empleado.id}
                              className="group relative transition-transform duration-200 hover:-translate-y-0.5"
                            >
                              <div
                                className={cn(
                                  "relative flex h-full flex-col justify-between rounded-xl border p-2.5 transition-all duration-200",
                                  esActual
                                    ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_2px_12px_rgba(16,185,129,0.06)] dark:border-emerald-500/35 dark:bg-emerald-500/[0.05]"
                                    : "border-grayscale-3/80 bg-grayscale-1/70 hover:border-grayscale-5 hover:bg-grayscale-1 hover:shadow-2xs dark:border-white/[0.10] dark:bg-[#161614] dark:hover:border-white/[0.20]",
                                )}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="relative shrink-0">
                                    <UserAvatar
                                      userId={empleado.id}
                                      name={empleado.nombre}
                                      size={30}
                                      className={cn(
                                        "ring-1.5 transition-transform duration-200 group-hover:scale-105",
                                        esActual
                                          ? "ring-emerald-500/50 dark:ring-emerald-400/50"
                                          : "ring-grayscale-3 dark:ring-white/15",
                                      )}
                                    />
                                  </div>

                                  {esActual ? (
                                    <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[8.5px] font-medium text-emerald-700 dark:text-emerald-400">
                                      Tú
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-2 min-w-0">
                                  <p className="truncate text-[11.5px] font-semibold text-grayscale-12">
                                    {nombreLimpio(empleado.nombre)}
                                  </p>
                                  <p className="truncate font-mono text-[9.5px] text-grayscale-9">
                                    {empleado.cargo}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* Detalles adicionales */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.32] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.14] dark:bg-[#121211]">
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
                    <div className="min-w-0">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Correo
                      </span>
                      <span className="truncate font-medium text-emerald-700 dark:text-emerald-400">
                        {usuario.correo}
                      </span>
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
                    <div className="min-w-0">
                      <span className="block font-mono text-[9.5px] uppercase tracking-wider text-grayscale-8">
                        Idiomas
                      </span>
                      <span className="font-medium text-grayscale-12">
                        {perfil.idiomas}
                      </span>
                    </div>
                  </div>
                </div>
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
