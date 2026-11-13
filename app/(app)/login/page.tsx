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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { recordarUsuario } from "@/components/mantenimiento/SesionSync";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SlotText } from "@/components/ui/SlotText";
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

const PORTAL_ROL: Record<Usuario["rol"], string> = {
  EMPLEADO: "Mis solicitudes",
  TECNICO: "Bandeja técnica",
  JEFATURA: "Indicadores",
};

function QuickProfilePicker({
  usuarios,
  activoId,
  enviando,
  onSelect,
}: {
  usuarios: Usuario[];
  activoId: string | null;
  enviando: boolean;
  onSelect: (user: Usuario) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const [focoId, setFocoId] = useState<string>(usuarios[0]?.id ?? "");
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const resaltadoId = activoId ?? focoId;
  const usuarioEnfocado =
    usuarios.find((u) => u.id === resaltadoId) ?? usuarios[0];

  useLayoutEffect(() => {
    const medir = () => {
      const el = botones.current.get(resaltadoId);
      if (!el) return;
      setPill({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    medir();

    const observador = new ResizeObserver(medir);
    if (contenedor.current) observador.observe(contenedor.current);
    return () => observador.disconnect();
  }, [resaltadoId, usuarios.length]);

  return (
    <div className="space-y-2.5">
      <div
        ref={contenedor}
        role="group"
        aria-label="Cuentas de acceso rápido"
        className="relative grid grid-cols-2 gap-1.5 rounded-2xl border border-grayscale-3/80 bg-grayscale-2/70 p-1.5 backdrop-blur-sm dark:border-grayscale-4/50 dark:bg-grayscale-2/55"
      >
        {pill && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-xl border border-grayscale-3/80 bg-white shadow-[0_2px_8px_rgba(28,22,16,0.06)] transition-[left,top,width,height] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-grayscale-4/60 dark:bg-grayscale-3"
            style={{
              left: pill.left,
              top: pill.top,
              width: pill.width,
              height: pill.height,
            }}
          />
        )}

        {usuarios.map((user) => {
          const enfocado = resaltadoId === user.id;
          const seleccionConfirmada = activoId === user.id;

          return (
            <button
              key={user.id}
              ref={(el) => {
                if (el) botones.current.set(user.id, el);
                else botones.current.delete(user.id);
              }}
              type="button"
              disabled={enviando}
              onMouseEnter={() => {
                if (!enviando) setFocoId(user.id);
              }}
              onFocus={() => {
                if (!enviando) setFocoId(user.id);
              }}
              onClick={() => onSelect(user)}
              className={cn(
                "group relative z-10 flex min-w-0 cursor-pointer flex-col justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-[opacity,transform] duration-150 ease-out active:scale-[0.985] disabled:cursor-default",
                enviando && !seleccionConfirmada && "opacity-45",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "font-mono text-[10px] font-medium transition-colors duration-150",
                    enfocado ? "text-grayscale-11" : "text-grayscale-8",
                  )}
                >
                  {ETIQUETA_ROL[user.rol]}
                </span>

                {seleccionConfirmada ? (
                  <CheckIcon
                    size={12}
                    weight="bold"
                    className="shrink-0 text-grayscale-12 animate-[fade-in-soft_120ms_ease-out]"
                  />
                ) : (
                  <ArrowRightIcon
                    size={11.5}
                    className={cn(
                      "shrink-0 transition-[transform,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      enfocado
                        ? "translate-x-0.5 text-grayscale-12"
                        : "text-grayscale-7",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-[13px] transition-colors duration-150",
                    enfocado
                      ? "font-semibold text-grayscale-12"
                      : "font-medium text-grayscale-11",
                  )}
                >
                  {nombreLimpio(user.nombre)}
                </p>
                <p className="truncate text-[11px] text-grayscale-9">
                  {user.departamento}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {usuarioEnfocado && (
        <p
          aria-live="polite"
          className="text-center text-[11.5px] text-grayscale-9"
        >
          <SlotText
            text={`${usuarioEnfocado.cargo} — ${PORTAL_ROL[usuarioEnfocado.rol]}`}
            options={{ duration: 220, stagger: 8, bounce: 0.18 }}
          />
        </p>
      )}
    </div>
  );
}

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
    }, 115);
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
      {/* Auroras ambientales arriba y abajo estilo Vercel */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="aurora-top" />
        <div className="aurora-bottom" />
      </div>

      {/* Barra superior minimalista */}
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

      {/* Bloque central abierto (sin contenedor exterior que encierre el login) */}
      <main
        className={cn(
          "login-enter relative z-10 mx-auto my-auto w-full max-w-[400px] py-8 transition-[opacity,transform] duration-150 ease-out",
          enviando && "scale-[0.992] opacity-75",
        )}
      >
        <div className="space-y-6">
          {/* Título directo sin subtítulos encima */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-grayscale-12 sm:text-[28px]">
              Iniciar sesión
            </h1>
            <p className="text-[13px] leading-relaxed text-grayscale-9">
              Ingresa con tu correo corporativo o elige una cuenta de acceso
              directo.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="shake rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-600 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Formulario abierto directamente sobre el lienzo */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                className="campo w-full px-3.5 py-2.5 text-[16px] shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:text-[13.5px]"
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
                  className="campo w-full py-2.5 pl-3.5 pr-10 text-[16px] shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:text-[13.5px]"
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
              className="group mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-grayscale-4 bg-grayscale-1 px-4 py-2.5 text-[13.5px] font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.05)] transition-[background-color,border-color,transform] duration-150 ease-out hover:border-grayscale-5 hover:bg-grayscale-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55 dark:border-grayscale-4 dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
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

          {/* Separador */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-grayscale-4/70 dark:bg-grayscale-4/45" />
            <span className="shrink-0 whitespace-nowrap font-mono text-[10.5px] text-grayscale-8">
              Acceso directo
            </span>
            <span className="h-px flex-1 bg-grayscale-4/70 dark:bg-grayscale-4/45" />
          </div>

          {/* Selector de perfiles con pastilla deslizante fluida */}
          <QuickProfilePicker
            usuarios={USUARIOS_INICIALES}
            activoId={perfilActivoId}
            enviando={enviando}
            onSelect={autenticarUsuario}
          />
        </div>
      </main>

      {/* Pie discreto */}
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center text-[11px] text-grayscale-8">
        <span>Servicios Internos · Sistema de Mantenimiento</span>
      </footer>
    </div>
  );
}
