"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparkleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordarUsuario } from "@/components/mantenimiento/SesionSync";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import {
  setUsuarioActual,
  USUARIOS_INICIALES,
} from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";

const DESTINOS: Record<Usuario["rol"], string> = {
  EMPLEADO: "/mis-solicitudes",
  TECNICO: "/mantenimiento",
  JEFATURA: "/indicadores",
};

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfilActivoId, setPerfilActivoId] = useState<string | null>(null);

  const autenticarUsuario = (user: Usuario) => {
    setEnviando(true);
    setPerfilActivoId(user.id);
    setError(null);

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

    // Micro-delay para animación nativa de éxito antes de navegar
    setTimeout(() => {
      router.push(DESTINOS[user.rol]);
    }, 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim()) {
      setError("Ingresa una dirección de correo institucional.");
      return;
    }

    // Buscar si coincide con alguno de los usuarios demostrativos
    const match = USUARIOS_INICIALES.find(
      (u) =>
        u.correo.toLowerCase() === correo.trim().toLowerCase() ||
        u.id.toLowerCase() === correo.trim().toLowerCase(),
    );

    if (match) {
      autenticarUsuario(match);
    } else {
      // Si ingresó cualquier otro correo, iniciamos con Empleado A como fallback
      const fallback = USUARIOS_INICIALES[0];
      autenticarUsuario(fallback);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white dark:bg-grayscale-1">
      {/* ── PANEL IZQUIERDO: Formulario de Login estilo Koyeb / Cloudflare ── */}
      <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
        {/* Barra superior con branding y selector de tema */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-grayscale-12 text-white dark:bg-white dark:text-grayscale-12">
              <WrenchIcon size={16} weight="bold" />
            </span>
            <div className="leading-none">
              <span className="font-mono text-[13px] font-bold tracking-tight text-grayscale-12">
                MANTENIMIENTO
              </span>
              <span className="block text-[10px] text-grayscale-9">
                Servicios Internos
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-grayscale-9">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistema en línea</span>
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Contenedor central perfectamente centrado y con max-width nativo (sin zoom en iOS) */}
        <main className="mx-auto my-auto w-full max-w-[420px] py-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-[26px] font-bold tracking-[-0.025em] text-grayscale-12 sm:text-[28px]">
                Iniciar sesión
              </h1>
              <p className="text-[13px] leading-relaxed text-grayscale-9">
                Ingresa con tu correo corporativo o selecciona un perfil rápido
                para acceder a la plataforma.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-600 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* Formulario directo */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-[12.5px] font-medium text-grayscale-11"
                >
                  Tu dirección de correo electrónico
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="nombre@organizacion.com"
                    /* text-[16px] en mobile previene el zoom forzado de Safari iOS, en desktop pasa a 14px */
                    className="w-full rounded-xl border border-grayscale-4 bg-white px-3.5 py-2.5 text-[16px] sm:text-[14px] text-grayscale-12 placeholder:text-grayscale-8 transition-all duration-150 focus:border-grayscale-12 focus:outline-none focus:ring-1 focus:ring-grayscale-12 dark:border-grayscale-4 dark:bg-grayscale-2 dark:focus:border-white dark:focus:ring-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <label
                    htmlFor="login-password"
                    className="font-medium text-grayscale-11"
                  >
                    Contraseña
                  </label>
                  <span className="font-mono text-[11px] text-grayscale-8">
                    (opcional en demo)
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-grayscale-4 bg-white py-2.5 pl-3.5 pr-10 text-[16px] sm:text-[14px] text-grayscale-12 placeholder:text-grayscale-8 transition-all duration-150 focus:border-grayscale-12 focus:outline-none focus:ring-1 focus:ring-grayscale-12 dark:border-grayscale-4 dark:bg-grayscale-2 dark:focus:border-white dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    aria-label={mostrarPassword ? "Ocultar" : "Mostrar"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-8 transition-colors hover:text-grayscale-12"
                  >
                    {mostrarPassword ? (
                      <EyeSlashIcon size={16} />
                    ) : (
                      <EyeIcon size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón principal estilo Koyeb (negro sólido, blanco en dark, hover suave) */}
              <button
                type="submit"
                disabled={enviando}
                className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-grayscale-12 py-2.5 px-4 text-[13.5px] font-semibold text-white shadow-2xs transition-all duration-150 hover:bg-grayscale-11 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-grayscale-12 dark:hover:bg-grayscale-2"
              >
                <span>
                  {enviando ? "Autenticando..." : "Continuar con correo electrónico"}
                </span>
                <ArrowRightIcon
                  size={14}
                  weight="bold"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </form>

            {/* Separador sutil con línea y texto central */}
            <div className="relative my-6 flex items-center justify-center">
              <span className="w-full border-t border-grayscale-3 dark:border-grayscale-3/60" />
              <span className="absolute bg-white px-3 font-mono text-[11px] text-grayscale-8 dark:bg-grayscale-1">
                o accede con perfil rápido
              </span>
            </div>

            {/* Accesos rápidos de demostración (sin badges ni puntos genéricos) */}
            <div className="space-y-2">
              {USUARIOS_INICIALES.map((user) => {
                const activo = perfilActivoId === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => autenticarUsuario(user)}
                    disabled={enviando}
                    className={cn(
                      "group flex w-full cursor-pointer items-center justify-between rounded-xl border border-grayscale-3/90 bg-grayscale-1/60 px-4 py-2.5 text-left transition-all duration-150 hover:border-grayscale-5 hover:bg-white dark:border-grayscale-4/40 dark:bg-grayscale-2/60 dark:hover:bg-grayscale-2",
                      activo && "border-grayscale-12 bg-white ring-1 ring-grayscale-12 dark:border-white dark:ring-white",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-grayscale-3 bg-white font-mono text-[11px] font-bold text-grayscale-11 shadow-2xs dark:border-grayscale-4 dark:bg-grayscale-3">
                        {user.rol[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-grayscale-12">
                          {nombreLimpio(user.nombre)}
                        </p>
                        <p className="truncate font-mono text-[11px] text-grayscale-8">
                          {user.correo} · {user.rol}
                        </p>
                      </div>
                    </div>

                    <ArrowRightIcon
                      size={13}
                      className="shrink-0 text-grayscale-6 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-12"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Footer legal */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[11.5px] text-grayscale-8">
          <span>Mantenimiento Interno v2.4</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-grayscale-11 transition-colors cursor-pointer">
              Términos de servicio
            </span>
            <span>·</span>
            <span className="hover:text-grayscale-11 transition-colors cursor-pointer">
              Política de privacidad
            </span>
          </div>
        </footer>
      </div>

      {/* ── PANEL DERECHO: Showcase Oscuro estilo Koyeb / Cloudflare ── */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-between bg-black p-12 xl:p-16 text-white overflow-hidden">
        {/* Fondo con grilla vectorial tenue */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
        />

        {/* Esfera abstracta de infraestructura (como el wireframe esférico de Koyeb) */}
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="relative size-72 xl:size-80 flex items-center justify-center">
            {/* Anillos concéntricos giratorios */}
            <div className="absolute inset-0 rounded-full border border-white/10 animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-dashed border-white/15 animate-[spin_40s_linear_infinite_reverse]" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <div className="absolute inset-16 rounded-full border border-dashed border-white/10" />

            {/* Isotipo central iluminado */}
            <div className="flex flex-col items-center justify-center text-center p-6 backdrop-blur-xs">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                <WrenchIcon size={28} weight="duotone" />
              </span>
              <p className="mt-4 font-mono text-[13px] font-bold tracking-widest uppercase text-white">
                SISTEMA OPERATIVO
              </p>
              <p className="text-[11px] font-mono text-white/50 tracking-wider">
                INFRAESTRUCTURA & SERVICIOS
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de impacto (como "DEPLOY INTENSIVE APPLICATIONS...") */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <p className="font-mono text-[12px] font-semibold tracking-wider uppercase text-emerald-400">
              OPERACIÓN CONTINUA EN TIEMPO REAL
            </p>
            <h2 className="text-[28px] xl:text-[32px] font-bold tracking-[-0.03em] leading-tight text-white max-w-lg">
              Resolución trazable de averías y mantenimiento de planta sin fricción.
            </h2>
          </div>

          {/* Chips técnicos limpios en cápsula cuadrada suave */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              "TIEMPO MEDIO < 48H",
              "TRAZABILIDAD ATÓMICA RN03",
              "REGLAS MULTI-ROL",
              "TELEMETRÍA EN VIVO",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer de confianza del panel derecho */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 font-mono">
          <span>CONTROL DE CALIDAD · OPERACIONES · IT</span>
          <span className="flex items-center gap-1.5 text-white/70">
            <GlobeIcon size={12} />
            <span>DISPONIBILIDAD 99.98%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
