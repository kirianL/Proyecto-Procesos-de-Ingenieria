"use client";

import {
  ArrowRightIcon,
  ChartLineIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ClockIcon,
  IdentificationBadgeIcon,
  PlusCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import Button from "@/components/public/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SolicitudCard } from "@/components/ui/SolicitudCard";
import { iniciales, nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
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

const ACCIONES = [
  {
    href: "/solicitudes/nueva",
    label: "Registrar una incidencia",
    detalle: "Describe la falla y su ubicación",
    icon: PlusCircleIcon,
    roles: ["EMPLEADO"],
  },
  {
    href: "/mis-solicitudes",
    label: "Revisar mis solicitudes",
    detalle: "Sigue el avance de tus reportes",
    icon: ClipboardTextIcon,
    roles: ["EMPLEADO", "TECNICO", "JEFATURA"],
  },
  {
    href: "/mantenimiento",
    label: "Abrir bandeja técnica",
    detalle: "Atiende la cola pendiente",
    icon: WrenchIcon,
    roles: ["TECNICO", "JEFATURA"],
  },
  {
    href: "/indicadores",
    label: "Ver indicadores",
    detalle: "Tiempos y distribución por estado",
    icon: ChartLineIcon,
    roles: ["TECNICO", "JEFATURA"],
  },
  {
    href: "/login",
    label: "Cambiar de perfil",
    detalle: "Prueba la vista de otro rol",
    icon: IdentificationBadgeIcon,
    roles: ["EMPLEADO", "TECNICO", "JEFATURA"],
  },
];

export default function Home() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [indicadores, setIndicadores] = useState<IndicadoresResumen | null>(
    null,
  );
  const [recientes, setRecientes] = useState<Solicitud[] | null>(null);

  useEffect(() => {
    const refrescar = () => {
      const actual = getUsuarioActual();
      setUsuario(actual);
      setIndicadores(getIndicadores());
      const bandeja =
        actual.rol === "EMPLEADO"
          ? getSolicitudesPorCreador(actual.id)
          : getBandejaMantenimiento();
      setRecientes(bandeja.slice(0, 3));
    };

    refrescar();
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  useAtajos({ n: () => router.push("/solicitudes/nueva") });

  const acciones = ACCIONES.filter((accion) =>
    accion.roles.includes(usuario.rol),
  );
  const tituloBandeja =
    usuario.rol === "EMPLEADO"
      ? "Tus últimas solicitudes"
      : "Actividad reciente";
  const primerNombre = nombreLimpio(usuario.nombre).split(" ")[0];
  const kpis = indicadores ?? INDICADORES_MUESTRA;
  const listaRecientes = recientes ?? SOLICITUDES_MUESTRA.slice(0, 3);

  return (
    <div className="flex flex-1 flex-col gap-7">
      <PageHeader
        eyebrow="Panel de trabajo"
        titulo={`Hola, ${primerNombre}`}
        descripcion="Este es el estado de las solicitudes de infraestructura y lo que tienes pendiente por revisar."
        acciones={
          <>
            {usuario.rol === "EMPLEADO" && (
              <Button
                href="/solicitudes/nueva"
                variant="secondary"
                className="hidden sm:inline-flex"
              >
                <PlusCircleIcon size={14} weight="bold" />
                <span>Nueva solicitud</span>
              </Button>
            )}
            <Button
              href={
                usuario.rol === "EMPLEADO"
                  ? "/mis-solicitudes"
                  : "/mantenimiento"
              }
              variant="primary"
            >
              {usuario.rol === "EMPLEADO"
                ? "Ver mis solicitudes"
                : "Abrir bandeja"}
            </Button>
          </>
        }
      />

      <SkeletonContent
        id="home-kpis"
        loading={indicadores === null}
        label="Cargando indicadores"
      >
        <section className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total"
            valor={kpis.totales}
            unidad="Solicitudes"
            detalle="Registradas en el sistema"
            dot="bg-grayscale-8"
            icon={ClipboardTextIcon}
            delay={0}
          />
          <MetricCard
            label="Pendientes"
            valor={kpis.porEstado.REGISTRADA}
            detalle="Sin diagnóstico asignado"
            dot="bg-amber-8"
            tono="amber"
            total={kpis.totales}
            icon={ClockIcon}
            delay={1}
          />
          <MetricCard
            label="En atención"
            valor={kpis.porEstado.EN_PROCESO}
            detalle="Trabajo técnico en curso"
            dot="bg-blue-8"
            tono="blue"
            total={kpis.totales}
            icon={WrenchIcon}
            delay={2}
          />
          <MetricCard
            label="Cerradas"
            valor={kpis.porEstado.CERRADA}
            detalle={`${kpis.porcentajeCumplimiento}% del total`}
            dot="bg-green-8"
            tono="emerald"
            total={kpis.totales}
            icon={CheckCircleIcon}
            delay={3}
          />
        </section>
      </SkeletonContent>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-grayscale-12">
              {tituloBandeja}
            </h2>
            <Link
              href={
                usuario.rol === "EMPLEADO"
                  ? "/mis-solicitudes"
                  : "/mantenimiento"
              }
              className="group inline-flex items-center gap-1 text-[12px] font-medium text-grayscale-10 transition-colors hover:text-grayscale-12"
            >
              Ver todas
              <ArrowRightIcon
                size={11}
                className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <SkeletonContent
            id="home-recientes"
            loading={recientes === null}
            label="Cargando solicitudes recientes"
          >
            {listaRecientes.length === 0 ? (
              <EmptyState
                icon={ClipboardTextIcon}
                titulo="Todavía no hay solicitudes"
                descripcion="Cuando registres una incidencia, aparecerá aquí con su estado en tiempo real."
                accion={
                  usuario.rol === "EMPLEADO" ? (
                    <Button href="/solicitudes/nueva" variant="primary">
                      <PlusCircleIcon size={14} weight="bold" />
                      <span>Crear la primera</span>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="stagger space-y-3">
                {listaRecientes.map((solicitud, index) => (
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
          </SkeletonContent>
        </section>

        <SkeletonContent
          id="home-aside"
          loading={indicadores === null}
          label="Cargando perfil y accesos"
        >
          <aside className="min-w-0 space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 border-b border-grayscale-3/80 pb-4 dark:border-grayscale-3/50">
                <span
                  skullet-block=""
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grayscale-2 font-mono text-[12px] font-semibold text-grayscale-11 dark:bg-grayscale-3"
                >
                  {iniciales(usuario.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-grayscale-12">
                    {nombreLimpio(usuario.nombre)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-grayscale-9">
                    {usuario.cargo}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <p className="section-label pb-1.5">Accesos rápidos</p>
                <div className="flex flex-col">
                  {acciones.map((accion) => {
                    const Icon = accion.icon;

                    return (
                      <Link
                        key={accion.href}
                        href={accion.href}
                        prefetch
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/60"
                      >
                        <span
                          skullet-block=""
                          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-grayscale-2 text-sand-9/80 transition-colors group-hover:text-sand-8/80 dark:text-sand-7/90"
                        >
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-grayscale-12">
                            {accion.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[10.5px] text-grayscale-9">
                            {accion.detalle}
                          </span>
                        </span>
                        <ArrowRightIcon
                          size={11}
                          className="shrink-0 text-grayscale-7 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-10"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {usuario.rol === "EMPLEADO" && (
              <div className="rounded-xl border border-dashed border-grayscale-4 px-4 py-3">
                <p className="text-[11px] leading-relaxed text-grayscale-9">
                  Pulsa{" "}
                  <kbd className="rounded border border-grayscale-4 bg-grayscale-1 px-1.5 py-0.5 font-mono text-[10px] text-grayscale-10">
                    N
                  </kbd>{" "}
                  para registrar una solicitud desde cualquier pantalla.
                </p>
              </div>
            )}
          </aside>
        </SkeletonContent>
      </div>
    </div>
  );
}
