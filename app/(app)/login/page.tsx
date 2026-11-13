"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const ETIQUETA_ROL: Record<Usuario["rol"], string> = {
  EMPLEADO: "Empleado",
  TECNICO: "Técnico",
  JEFATURA: "Jefatura",
};

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfilActivoId, setPerfilActivoId] = useState<string | null>(null);

  useEffect(() => {
    for (const ruta of Object.values(DESTINOS)) {
      router.prefetch(ruta);
    }
  }, [router]);

  const autenticarUsuario = (user: Usuario) => {
    if (enviando) return;
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

    setTimeout(() => {
      router.push(DESTINOS[user.rol]);
    }, 120);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim()) {
      setError("Ingresa una dirección de correo institucional.");
      return;
    }

    const match = USUARIOS_INICIALES.find(
      (u) =>
        u.correo.toLowerCase() === correo.trim().toLowerCase() ||
        u.id.toLowerCase() === correo.trim().toLowerCase(),
    );

    autenticarUsuario(match ?? USUARIOS_INICIALES[0]);
  };

  return (
    <div className="app-canvas relative flex min-h-screen w-full flex-col justify-between overflow-hidden px-5 py-6 text-grayscale-12 sm:px-8 sm:py-8">
      {/* Auroras ambientales sutiles arriba y abajo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="aurora-top" />
        <div className="aurora-bottom" />
      </div>

      {/* Barra superior minimalista consistente con el portal */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-grayscale-12 transition-opacity duration-150 hover:opacity-80"
        >
          <span className="icon-tile flex size-7 items-center justify-center rounded-lg">
            <WrenchIcon size={14} weight="bold" />
          </span>
          <span className="text-[13.5px] font-semibold tracking-[-0.02em]">
            Mantenimiento
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Bloque central alineado al chasis dual-tone del sistema */}
      <main
        className={cn(
          "login-enter relative z-10 mx-auto my-auto w-full max-w-[430px] py-6 transition-[opacity,transform] duration-150 ease-out",
          enviando && "scale-[0.992] opacity-75",
        )}
      >
        <div className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1.5 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
          {/* Isla superior: título directo y formulario */}
          <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 sm:p-6">
            <div className="space-y-1.5 text-center">
              <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-grayscale-12 sm:text-[26px]">
                Iniciar sesión
              </h1>
              <p className="text-[13px] leading-relaxed text-grayscale-9">
                Accede con tu correo corporativo o elige una cuenta autorizada.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="shake mt-4 rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-[12.5px] text-red-600 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-[12px] font-medium text-grayscale-11"
                >
                  Correo electrónico
                </label>
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
                  className="campo w-full px-3.5 py-2.5 text-[16px] sm:text-[13.5px]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[12px] font-medium text-grayscale-11"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="campo w-full py-2.5 pl-3.5 pr-10 text-[16px] sm:text-[13.5px]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    aria-label={mostrarPassword ? "Ocultar" : "Mostrar"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-grayscale-8 transition-colors duration-150 hover:text-grayscale-12"
                  >
                    {mostrarPassword ? (
                      <EyeSlashIcon size={15} />
                    ) : (
                      <EyeIcon size={15} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="group mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-grayscale-4 bg-grayscale-2 px-4 py-2.5 text-[13.5px] font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[background-color,border-color,transform] duration-150 ease-out hover:border-grayscale-5 hover:bg-grayscale-3 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55 dark:border-grayscale-4 dark:bg-grayscale-3 dark:hover:bg-grayscale-4"
              >
                <span>
                  {enviando ? "Ingresando..." : "Continuar con correo"}
                </span>
                <ArrowRightIcon
                  size={13.5}
                  weight="bold"
                  className="text-grayscale-9 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-12"
                />
              </button>
            </form>
          </div>

          {/* Sección inferior integrada en el chasis gris: acceso rápido */}
          <div className="px-1.5 pb-1 pt-2.5">
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] text-grayscale-9">
              <span className="font-medium text-grayscale-10">
                Acceso directo
              </span>
              <span className="font-mono text-[10px]">
                Selecciona una cuenta
              </span>
            </div>

            <div className="overflow-hidden rounded-[0.85rem] border border-grayscale-3/70 bg-white/90 divide-y divide-grayscale-3/60 dark:border-grayscale-4/40 dark:bg-grayscale-2/85 dark:divide-grayscale-4/35">
              {USUARIOS_INICIALES.map((user) => {
                const activo = perfilActivoId === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => autenticarUsuario(user)}
                    disabled={enviando}
                    className={cn(
                      "group flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-[background-color,opacity,transform] duration-150 ease-out hover:bg-grayscale-1 active:scale-[0.995] disabled:cursor-default dark:hover:bg-grayscale-3/60",
                      activo && "bg-grayscale-2/80 dark:bg-grayscale-3/80",
                      enviando && !activo && "opacity-45",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-grayscale-12">
                        {nombreLimpio(user.nombre)}
                      </p>
                      <p className="truncate text-[11px] text-grayscale-9">
                        {user.cargo} · {user.departamento}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[10.5px] font-medium text-grayscale-10">
                        {ETIQUETA_ROL[user.rol]}
                      </span>
                      {activo ? (
                        <CheckIcon
                          size={13}
                          weight="bold"
                          className="text-grayscale-12 animate-[fade-in-soft_120ms_ease-out]"
                        />
                      ) : (
                        <ArrowRightIcon
                          size={12}
                          className="text-grayscale-8 transition-[transform,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-12"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Pie discreto */}
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center text-[11px] text-grayscale-8">
        <span>Servicios Internos · Sistema de Mantenimiento</span>
      </footer>
    </div>
  );
}
