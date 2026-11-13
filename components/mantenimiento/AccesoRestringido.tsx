"use client";

import {
  ArrowLeftIcon,
  IdentificationBadgeIcon,
  LockSimpleIcon,
  ShieldWarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Button from "@/components/public/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { nombreLimpio } from "@/helpers/iniciales";
import type { Rol, Usuario } from "@/lib/mantenimiento/types";

interface AccesoRestringidoProps {
  tituloPantalla: string;
  usuario: Usuario;
  rolesPermitidos: readonly Rol[];
  motivo: string;
}

const ETIQUETA_ROL: Record<Rol, string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico de mantenimiento",
  JEFATURA: "Jefatura de operaciones",
};

const RUTA_POR_ROL: Record<Rol, { href: string; label: string }> = {
  EMPLEADO: { href: "/mis-solicitudes", label: "Volver a Mis solicitudes" },
  TECNICO: { href: "/mantenimiento", label: "Ir a Bandeja técnica" },
  JEFATURA: { href: "/indicadores", label: "Ir a Indicadores" },
};

export function AccesoRestringido({
  tituloPantalla,
  usuario,
  rolesPermitidos,
  motivo,
}: AccesoRestringidoProps) {
  const retorno = RUTA_POR_ROL[usuario.rol];
  const perfilesRequeridos = rolesPermitidos
    .map((rol) => ETIQUETA_ROL[rol])
    .join(" o ");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Permisos de cuenta"
        titulo={tituloPantalla}
        descripcion="Esta sección requiere permisos específicos dentro del portal de servicios internos."
      />

      <div
        role="alert"
        data-testid="acceso-restringido-403"
        className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]"
      >
        <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-6 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-5">
          <div className="flex items-start gap-3.5">
            <span className="tile-status mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <ShieldWarningIcon size={20} weight="duotone" />
            </span>
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Acceso restringido
              </span>
              <h2 className="text-[15px] font-semibold text-grayscale-12">
                Tu cuenta actual no tiene acceso a esta vista
              </h2>
              <p className="text-[13px] leading-relaxed text-grayscale-10">
                {motivo}
              </p>
            </div>
          </div>

          <div className="surface-soft grid gap-3 rounded-xl p-4 sm:grid-cols-2 text-[12px]">
            <div className="space-y-0.5">
              <span className="text-grayscale-9 block">Cuenta activa</span>
              <span className="font-medium text-grayscale-12">
                {nombreLimpio(usuario.nombre)} · {ETIQUETA_ROL[usuario.rol]}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-grayscale-9 block">Acceso habilitado para</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-grayscale-12">
                <LockSimpleIcon size={13} weight="bold" />
                {perfilesRequeridos}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grayscale-3/70 pt-4 dark:border-grayscale-3/40">
            <Button href={retorno.href} variant="secondary">
              <ArrowLeftIcon size={14} weight="bold" />
              <span>{retorno.label}</span>
            </Button>
            <Button href="/login" variant="primary">
              <IdentificationBadgeIcon size={15} weight="bold" />
              <span>Cambiar de cuenta</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
