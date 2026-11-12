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
  codigoPantalla: string;
  tituloPantalla: string;
  usuario: Usuario;
  rolesPermitidos: readonly Rol[];
  motivo: string;
  reglaReferencia?: string;
}

const RUTA_POR_ROL: Record<Rol, { href: string; label: string }> = {
  EMPLEADO: { href: "/mis-solicitudes", label: "Ir a Mis solicitudes" },
  TECNICO: { href: "/mantenimiento", label: "Ir a Bandeja técnica" },
  JEFATURA: { href: "/indicadores", label: "Ir a Indicadores" },
};

export function AccesoRestringido({
  codigoPantalla,
  tituloPantalla,
  usuario,
  rolesPermitidos,
  motivo,
  reglaReferencia = "RNF02 · ADR-002",
}: AccesoRestringidoProps) {
  const retorno = RUTA_POR_ROL[usuario.rol];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        codigo={codigoPantalla}
        eyebrow="Control de acceso (403)"
        titulo={tituloPantalla}
        descripcion="Operación protegida por políticas de autorización y propiedad del recurso."
      />

      <div
        role="alert"
        data-testid="acceso-restringido-403"
        className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50"
      >
        <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-6 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 space-y-5">
          <div className="flex items-start gap-3.5">
            <span className="tile-status mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <ShieldWarningIcon size={20} weight="duotone" />
            </span>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  HTTP 403 · Acceso denegado
                </span>
                <span className="rounded-md bg-grayscale-2 px-1.5 py-0.5 font-mono text-[10.5px] text-grayscale-10">
                  {reglaReferencia}
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-grayscale-12">
                No tiene permisos para acceder a este recurso
              </h2>
              <p className="text-[13px] leading-relaxed text-grayscale-10">
                {motivo}
              </p>
            </div>
          </div>

          <div className="surface-soft grid gap-3 rounded-xl p-4 sm:grid-cols-2 text-[12px]">
            <div className="space-y-0.5">
              <span className="text-grayscale-9 block">Sesión activa</span>
              <span className="font-medium text-grayscale-12">
                {nombreLimpio(usuario.nombre)} ({usuario.rol})
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-grayscale-9 block">Perfil requerido</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-medium text-grayscale-12">
                <LockSimpleIcon size={13} weight="bold" />
                {rolesPermitidos.join(" / ")}
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
              <span>Cambiar de perfil en I01</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
