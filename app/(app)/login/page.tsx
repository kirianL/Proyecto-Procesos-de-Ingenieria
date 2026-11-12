"use client";

import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  EyeIcon,
  ShieldCheckIcon,
  StarIcon,
  UserGearIcon,
  UserIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { recordarUsuario } from "@/components/mantenimiento/SesionSync";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { cn } from "@/helpers/classname-helper";
import { iniciales, nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import {
  getBandejaMantenimiento,
  getIndicadores,
  getSolicitudesPorCreador,
  setUsuarioActual,
  USUARIOS_INICIALES,
} from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";

const ROL_CONFIG: Record<
  Usuario["rol"],
  {
    icon: typeof UserIcon;
    bannerGradient: string;
    avatarBorder: string;
    destino: string;
    tagline: string;
    nivelAcceso: string;
  }
> = {
  EMPLEADO: {
    icon: UserIcon,
    bannerGradient:
      "from-emerald-600 via-teal-600 to-emerald-400 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-600",
    avatarBorder:
      "border-emerald-500/30 text-emerald-800 dark:text-emerald-300",
    destino: "/mis-solicitudes",
    tagline: "Reporte y seguimiento directo de infraestructura",
    nivelAcceso: "Nivel 1 · Operación",
  },
  TECNICO: {
    icon: UserGearIcon,
    bannerGradient:
      "from-blue-600 via-indigo-600 to-sky-400 dark:from-blue-800 dark:via-indigo-800 dark:to-sky-600",
    avatarBorder: "border-blue-500/30 text-blue-800 dark:text-blue-300",
    destino: "/mantenimiento",
    tagline: "Atención técnica, diagnóstico y cierre de órdenes",
    nivelAcceso: "Nivel 2 · Servicio",
  },
  JEFATURA: {
    icon: BriefcaseIcon,
    bannerGradient:
      "from-amber-600 via-orange-600 to-amber-400 dark:from-amber-800 dark:via-orange-800 dark:to-amber-600",
    avatarBorder: "border-amber-500/30 text-amber-800 dark:text-amber-300",
    destino: "/indicadores",
    tagline: "Supervisión de KPIs, MTTR y carga por prioridad",
    nivelAcceso: "Nivel 3 · Dirección",
  },
};

export default function LoginPage() {
  const router = useRouter();

  const entrar = (user: Usuario) => {
    setUsuarioActual(user.id);
    recordarUsuario(user.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("usuario-cambiado", { detail: user }),
      );
    }

    fetch("/api/auth/cambiar-usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id }),
    }).catch(() => {});

    router.push(ROL_CONFIG[user.rol].destino);
  };

  useAtajos({
    ...Object.fromEntries(
      USUARIOS_INICIALES.map((user, index) => [
        String(index + 1),
        () => entrar(user),
      ]),
    ),
    escape: () => router.push("/"),
  });

  // Metadatos calculados para las 3 columnas de estadísticas de cada perfil
  interface StatItem {
    label: string;
    valor: number | string;
    icon: typeof StarIcon;
    suffix?: string;
    isText?: boolean;
  }

  const statsPorUsuario = (user: Usuario): StatItem[] => {
    if (user.rol === "EMPLEADO") {
      const creadas = getSolicitudesPorCreador(user.id);
      const resueltas = creadas.filter((s) => s.estado === "CERRADA").length;
      return [
        { label: "Reportes", valor: creadas.length, icon: ClipboardTextIcon },
        { label: "Resueltas", valor: resueltas, icon: CheckCircleIcon },
        {
          label: "Alcance",
          valor: "Edificio",
          icon: ShieldCheckIcon,
          isText: true,
        },
      ];
    }

    if (user.rol === "TECNICO") {
      const cola = getBandejaMantenimiento();
      const enProceso = cola.filter((s) => s.estado === "EN_PROCESO").length;
      return [
        { label: "En cola", valor: cola.length, icon: WrenchIcon },
        { label: "En curso", valor: enProceso, icon: ClipboardTextIcon },
        { label: "Efectividad", valor: 98, suffix: "%", icon: StarIcon },
      ];
    }

    const ind = getIndicadores();
    return [
      { label: "MTTR", valor: 39, suffix: "h", icon: StarIcon },
      {
        label: "Cierre",
        valor: ind.porcentajeCumplimiento,
        suffix: "%",
        icon: CheckCircleIcon,
      },
      { label: "Auditoría", valor: "Total", icon: EyeIcon, isText: true },
    ];
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-6">
        <PageHeader
          codigo="I01"
          eyebrow="Acceso"
          titulo="Elige tu perfil"
          descripcion="Selecciona una cuenta de demostración. El sistema adapta vistas, permisos y panel de trabajo al instante."
        />

        <SkeletonContent
          id="login-perfiles"
          minLoadMs={280}
          label="Cargando perfiles disponibles"
        >
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {USUARIOS_INICIALES.map((user, index) => {
              const cfg = ROL_CONFIG[user.rol];
              const RoleIcon = cfg.icon;
              const handle = `@${user.correo.split("@")[0]}`;
              const stats = statsPorUsuario(user);

              return (
                <article
                  key={user.id}
                  style={{ "--stagger": index } as CSSProperties}
                  className="card flex flex-col justify-between rounded-[1.4rem] border border-grayscale-3/85 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:border-grayscale-4 hover:shadow-xs dark:border-grayscale-4/40 dark:bg-grayscale-2"
                >
                  <div className="flex-1 space-y-3">
                    {/* 1. Banner superior gradiente con avatar circular superpuesto */}
                    <div className="relative">
                      <div
                        className={cn(
                          "h-20 w-full rounded-2xl bg-gradient-to-tr shadow-inner",
                          cfg.bannerGradient,
                        )}
                      />

                      {/* Avatar circular empotrado */}
                      <div className="absolute -bottom-5 left-3.5 flex items-center">
                        <span
                          skullet-block=""
                          className={cn(
                            "flex size-12 items-center justify-center rounded-full border-2 border-white bg-grayscale-1 font-mono text-[12px] font-bold shadow-xs dark:border-grayscale-2 dark:bg-grayscale-3",
                            cfg.avatarBorder,
                          )}
                        >
                          {iniciales(user.nombre)}
                        </span>
                      </div>
                    </div>

                    {/* 2. Cabecera con Nombre, Handle, Rol y Nivel de acceso */}
                    <div className="pt-4 px-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-[15px] font-bold tracking-tight text-grayscale-12">
                            {nombreLimpio(user.nombre)}
                          </h2>
                          <p className="truncate font-mono text-[11px] text-grayscale-9">
                            {handle}
                          </p>
                        </div>

                        {/* Etiqueta compacta de rol */}
                        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium text-grayscale-9">
                          <RoleIcon size={12} weight="bold" />
                          <span>{user.rol}</span>
                        </span>
                      </div>

                      <p className="mt-2 text-[11.5px] leading-relaxed text-grayscale-10 line-clamp-2">
                        {user.cargo} · {user.departamento}
                      </p>
                    </div>

                    {/* 3. Métricas en 3 columnas como en la referencia (Rating, Posts, Followers) */}
                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-grayscale-3/60 bg-grayscale-1/60 p-2.5 text-center dark:border-grayscale-4/30 dark:bg-grayscale-3/30">
                      {stats.map((col, cIdx) => {
                        const ColIcon = col.icon;
                        return (
                          <div
                            key={cIdx}
                            className="flex flex-col items-center"
                          >
                            <span className="flex items-center gap-1 font-mono text-[13px] font-bold text-grayscale-12">
                              <ColIcon
                                size={12}
                                weight="bold"
                                className="text-grayscale-9 shrink-0"
                              />
                              {col.isText ? (
                                <span>{col.valor}</span>
                              ) : (
                                <SlotNumber
                                  value={col.valor as number}
                                  suffix={col.suffix}
                                  className="font-bold font-mono text-[13px]"
                                />
                              )}
                            </span>
                            <span className="mt-0.5 text-[10px] font-medium text-grayscale-9">
                              {col.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Botón inferior ancho "Entrar como este perfil" con flecha circular */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => entrar(user)}
                      className="group flex w-full cursor-pointer items-center justify-between rounded-xl bg-grayscale-12 px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all duration-150 hover:bg-grayscale-11 active:scale-[0.99] dark:bg-white dark:text-grayscale-12 dark:hover:bg-grayscale-2"
                    >
                      <span>Entrar al perfil</span>
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 dark:bg-black/10">
                        <ArrowRightIcon size={12} weight="bold" />
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </SkeletonContent>
      </div>

      <BottomBar
        statusInfo={{
          title: "Acceso rápido multi-rol",
          subtitle:
            "Pulsa teclas 1 al 4 para entrar directamente sin hacer clic.",
        }}
        shortcuts={[
          { key: "1–4", label: "Elegir perfil" },
          { key: "Esc", label: "Volver al panel" },
        ]}
      />
    </div>
  );
}
