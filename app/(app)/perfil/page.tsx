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
              className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]"
              style={{ "--stagger": 0 } as CSSProperties}
            >
              <div className="overflow-hidden rounded-[1rem] border border-grayscale-3/60 bg-white shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
                {/* Banner ilustrado */}
                <div
                  skullet-block=""
                  className="relative h-32 w-full overflow-hidden border-b border-grayscale-3/80 bg-emerald-50 sm:h-40 dark:border-white/[0.08] dark:bg-emerald-950/30"
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
                        className="-mt-10 relative flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-grayscale-2 font-mono text-[20px] font-bold text-grayscale-12 shadow-xs dark:border-[#121211] dark:bg-grayscale-3"
                      >
                        {inicialesDe(usuario.nombre)}
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
                        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors duration-150",
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
                  className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
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
                  className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]"
                  style={{ "--stagger": 1 } as CSSProperties}
                >
                  <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
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
              <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
                <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-3">
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
              <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
                <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-2.5">
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
            {/* Jerarquía / Equipo */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3">
                    <UsersThreeIcon size={13} />
                  </span>
                  <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                    Estructura del área
                  </h3>
                </div>

                <div className="space-y-2">
                  {jerarquia.map((miembro, idx) => {
                    const esActual = miembro.id === usuario.id;
                    return (
                      <div
                        key={miembro.id}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                          esActual
                            ? "bg-grayscale-2/90 ring-1 ring-grayscale-4/80 dark:bg-white/[0.06] dark:ring-white/[0.12]"
                            : "hover:bg-grayscale-1/70 dark:hover:bg-white/[0.02]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
                            esActual
                              ? "bg-grayscale-12 text-grayscale-1 dark:bg-white dark:text-[#121211]"
                              : "border border-grayscale-3/80 bg-grayscale-2 text-grayscale-10 dark:border-white/[0.08] dark:bg-white/[0.06]",
                          )}
                        >
                          {inicialesDe(miembro.nombre)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[12px] font-semibold text-grayscale-12">
                              {nombreLimpio(miembro.nombre)}
                            </p>
                            {esActual ? (
                              <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-grayscale-10 ring-1 ring-grayscale-3 dark:bg-white/[0.08] dark:text-grayscale-11 dark:ring-white/[0.08]">
                                Tú
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-[10.5px] text-grayscale-9">
                            {miembro.cargo}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[9.5px] text-grayscale-8">
                          N{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Detalles adicionales */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
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
