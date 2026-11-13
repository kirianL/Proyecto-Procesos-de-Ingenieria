"use client";

import {
  BookmarkSimpleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  StackIcon,
  TrayIcon,
  WrenchIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import Button from "@/components/public/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  OPCIONES_PRIORIDAD,
  type Prioridad,
} from "@/components/ui/PriorityPicker";
import {
  SegmentedControl,
  type Segmento,
} from "@/components/ui/SegmentedControl";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { SolicitudCard } from "@/components/ui/SolicitudCard";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import {
  puedeGestionarAtencion,
  puedeVerBandejaTecnica,
} from "@/lib/mantenimiento/auth";
import { calcularEstadoSla } from "@/lib/mantenimiento/sla";
import {
  getBandejaMantenimiento,
  getUsuarioActual,
  SOLICITUDES_MUESTRA,
} from "@/lib/mantenimiento/store";
import type { Estado, Solicitud, Usuario } from "@/lib/mantenimiento/types";

type TabFilter = "TODAS" | Estado;
type PrioridadFiltro = "TODAS" | Prioridad;

const ESTADOS_VALIDOS: TabFilter[] = [
  "TODAS",
  "REGISTRADA",
  "EN_PROCESO",
  "CERRADA",
];

export default function BandejaMantenimientoPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [filtro, setFiltro] = useState<TabFilter>("TODAS");
  const [prioridad, setPrioridad] = useState<PrioridadFiltro>("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);

  useEffect(() => {
    const refrescar = () => {
      setUsuario(getUsuarioActual());
      setSolicitudes(getBandejaMantenimiento());
    };
    refrescar();
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  // Permite llegar desde indicadores con ?estado=REGISTRADA, etc.
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const estado = parametros.get("estado") as TabFilter | null;
    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      setFiltro(estado);
    }
    const prioridadParam = parametros.get("prioridad");
    if (
      prioridadParam &&
      OPCIONES_PRIORIDAD.some((opcion) => opcion.id === prioridadParam)
    ) {
      setPrioridad(prioridadParam as Prioridad);
    }
  }, []);

  const lista = solicitudes ?? SOLICITUDES_MUESTRA;
  const totalRegistradas = lista.filter(
    (s) => s.estado === "REGISTRADA",
  ).length;
  const totalEnProceso = lista.filter((s) => s.estado === "EN_PROCESO").length;
  const totalCerradas = lista.filter((s) => s.estado === "CERRADA").length;
  const abiertas = totalRegistradas + totalEnProceso;

  const consulta = busqueda.trim().toLowerCase();
  const solicitudesFiltradas = lista.filter((solicitud) => {
    const coincideEstado = filtro === "TODAS" || solicitud.estado === filtro;
    const coincidePrioridad =
      prioridad === "TODAS" || solicitud.prioridad === prioridad;
    const coincideBusqueda =
      consulta.length === 0 ||
      `${solicitud.id} ${solicitud.titulo} ${solicitud.ubicacion} ${solicitud.descripcion}`
        .toLowerCase()
        .includes(consulta);

    return coincideEstado && coincidePrioridad && coincideBusqueda;
  });

  const hayFiltrosActivos =
    filtro !== "TODAS" ||
    prioridad !== "TODAS" ||
    busqueda.trim().length > 0;

  const limpiarFiltros = () => {
    setFiltro("TODAS");
    setPrioridad("TODAS");
    setBusqueda("");
  };

  const TABS: Segmento<TabFilter>[] = [
    { id: "TODAS", label: "Todas", count: lista.length, icon: StackIcon },
    {
      id: "REGISTRADA",
      label: "Pendientes",
      count: totalRegistradas,
      icon: TrayIcon,
    },
    {
      id: "EN_PROCESO",
      label: "En proceso",
      count: totalEnProceso,
      icon: WrenchIcon,
    },
    {
      id: "CERRADA",
      label: "Cerradas",
      count: totalCerradas,
      icon: CheckCircleIcon,
    },
  ];

  const autorizado = puedeVerBandejaTecnica(usuario);
  const puedeAtender = puedeGestionarAtencion(usuario);

  useAtajos(
    {
      "1": () => setFiltro("TODAS"),
      "2": () => setFiltro("REGISTRADA"),
      "3": () => setFiltro("EN_PROCESO"),
      "4": () => setFiltro("CERRADA"),
      escape: () => router.push("/"),
    },
    autorizado,
  );

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Bandeja de mantenimiento"
        usuario={usuario}
        rolesPermitidos={["TECNICO", "JEFATURA"]}
        motivo="La bandeja consolidada de incidencias contiene reportes de toda la organización y está reservada para el equipo técnico y la jefatura de operaciones."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-5">
        <PageHeader
          codigo="I05"
          eyebrow="Personal técnico"
          titulo="Bandeja de mantenimiento"
          meta={
            <span className="badge bg-green-3 px-2.5 py-1 text-[12px] text-green-11 inline-flex items-center gap-1.5">
              <span className="badge-dot bg-green-9" />
              <span>{nombreLimpio(usuario.nombre)} ·</span>
              <SlotNumber value={abiertas} className="font-semibold text-green-12" />
              <span>abiertas</span>
            </span>
          }
        />

        <SegmentedControl
          items={TABS}
          value={filtro}
          onChange={(nuevoEstado) => {
            setFiltro(nuevoEstado);
          }}
          ariaLabel="Filtrar solicitudes por estado"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-8"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
              }}
              placeholder="Buscar por ID, título o ubicación…"
              aria-label="Buscar solicitudes"
              className="campo w-full py-2 pl-9 pr-3 text-[16px] sm:text-[13px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro-prioridad" className="sr-only">
              Filtrar por prioridad
            </label>
            <select
              id="filtro-prioridad"
              value={prioridad}
              onChange={(event) => {
                setPrioridad(event.target.value as PrioridadFiltro);
              }}
              className="campo h-[38px] w-full cursor-pointer px-3 text-[16px] sm:w-auto sm:text-[12.5px]"
            >
              <option value="TODAS">Todas las prioridades</option>
              {OPCIONES_PRIORIDAD.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  Prioridad {opcion.label.toLowerCase()}
                </option>
              ))}
            </select>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex h-[38px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-grayscale-3 bg-grayscale-1 px-2.5 text-[12px] font-medium text-grayscale-10 transition-colors duration-150 hover:bg-grayscale-2 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
              >
                <XIcon size={12} weight="bold" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="min-h-[360px] max-h-[60vh] overflow-y-scroll pr-1 [scrollbar-gutter:stable]">
          <SkeletonContent
            id="bandeja-mantenimiento"
            loading={solicitudes === null}
            minLoadMs={280}
            label="Cargando bandeja de mantenimiento"
          >
            {solicitudesFiltradas.length === 0 ? (
              <EmptyState
                icon={MagnifyingGlassIcon}
                titulo={
                  hayFiltrosActivos
                    ? "Sin coincidencias"
                    : "La bandeja está vacía"
                }
                descripcion={
                  hayFiltrosActivos
                    ? "Prueba con otro estado, otra prioridad o un término de búsqueda más corto."
                    : "Cuando un empleado registre una incidencia aparecerá aquí para su atención."
                }
                accion={
                  hayFiltrosActivos ? (
                    <Button variant="secondary" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="stagger space-y-3">
                {solicitudesFiltradas.map((solicitud, index) => (
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
                      pie={
                        solicitud.estado === "CERRADA"
                          ? "Servicio finalizado"
                          : "Pendiente de atención técnica"
                      }
                      acciones={
                        <div className="flex items-center gap-2">
                          <Button
                            href={`/solicitudes/${solicitud.id}`}
                            variant="secondary"
                          >
                            Detalle
                          </Button>

                          {solicitud.estado === "CERRADA" ? (
                            <span className="flex items-center gap-1 px-1 text-[11px] text-grayscale-9">
                              <CheckCircleIcon size={13} weight="bold" />
                              Atendida
                            </span>
                          ) : puedeAtender ? (
                            <Button
                              href={`/mantenimiento/${solicitud.id}/atencion`}
                              variant="primary"
                            >
                              <WrenchIcon size={13} weight="bold" />
                              <span>Atender</span>
                            </Button>
                          ) : null}
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </SkeletonContent>
        </div>
      </div>

      <BottomBar
        statusInfo={{
          title:
            solicitudes === null
              ? "Cargando bandeja"
              : `${solicitudesFiltradas.length} de ${lista.length} solicitudes visibles`,
          subtitle: `${totalRegistradas} ${
            totalRegistradas === 1 ? "pendiente" : "pendientes"
          } · ${totalEnProceso} en proceso · ${totalCerradas} ${
            totalCerradas === 1 ? "cerrada" : "cerradas"
          }`,
        }}
        shortcuts={[
          { key: "1–4", label: "Filtrar" },
          { key: "Esc", label: "Volver al panel" },
        ]}
      />
    </div>
  );
}
