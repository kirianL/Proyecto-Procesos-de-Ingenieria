"use client";

import {
  CheckIcon,
  MapPinIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import Button from "@/components/public/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { type Prioridad, PriorityPicker } from "@/components/ui/PriorityPicker";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotText } from "@/components/ui/SlotText";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeCrearSolicitud } from "@/lib/mantenimiento/auth";
import { crearSolicitud, getUsuarioActual } from "@/lib/mantenimiento/store";
import type { Usuario } from "@/lib/mantenimiento/types";

const ETIQUETA = "block text-[12.5px] font-medium text-grayscale-11";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());

  useEffect(() => {
    const actualizar = () => setUsuario(getUsuarioActual());
    actualizar();
    window.addEventListener("usuario-cambiado", actualizar);
    return () => window.removeEventListener("usuario-cambiado", actualizar);
  }, []);

  const [titulo, setTitulo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA");
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const autorizado = puedeCrearSolicitud(usuario);
  const cancelar = () => router.push("/mis-solicitudes");

  useAtajos(
    {
      "ctrl+enter": () => formRef.current?.requestSubmit(),
      escape: cancelar,
    },
    autorizado,
  );

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Nueva solicitud"
        usuario={usuario}
        rolesPermitidos={["EMPLEADO"]}
        motivo="La creación de nuevos reportes de mantenimiento está habilitada para las cuentas del personal solicitante."
      />
    );
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const faltante = !titulo.trim()
      ? "El título de la solicitud es obligatorio."
      : !ubicacion.trim()
        ? "La ubicación es obligatoria."
        : !descripcion.trim()
          ? "Describe el problema con detalle para poder atenderlo."
          : null;

    if (faltante) {
      setError(faltante);
      setIntento((valor) => valor + 1);
      return;
    }

    try {
      setEnviando(true);
      const nueva = crearSolicitud({
        creadorId: usuario.id,
        titulo,
        ubicacion,
        descripcion,
        prioridad,
      });

      fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, ubicacion, descripcion, prioridad }),
      }).catch(() => {});

      router.push(`/solicitudes/${nueva.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la solicitud.",
      );
      setIntento((valor) => valor + 1);
      setEnviando(false);
    }
  };

  const restantes = 800 - descripcion.length;

  return (
    <div className="mx-auto w-full max-w-3xl 2xl:max-w-4xl space-y-6">
      <PageHeader
        codigo="I02"
        eyebrow="Registro"
        volver={{ href: "/mis-solicitudes", label: "Mis solicitudes" }}
        titulo="Nueva solicitud"
        descripcion="Cuéntanos qué ocurre, dónde y desde cuándo. Cuanto más concreto sea el detalle, más rápida será la atención."
      />

      <SkeletonContent
        id="nueva-solicitud-form"
        minLoadMs={280}
        label="Preparando formulario de registro"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              key={intento}
              role="alert"
              className="surface-soft shake flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12px] text-grayscale-11 border border-red-500/20 bg-red-500/10"
            >
              <WarningCircleIcon
                size={16}
                weight="fill"
                className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
              />
              <span>{error}</span>
            </div>
          )}

          {/* Tarjeta con fusión moderna dual-tone */}
          <div className="card rounded-[1.25rem] border border-grayscale-3/85 bg-grayscale-2 p-1 shadow-2xs dark:border-grayscale-4/40 dark:bg-grayscale-3/50">
            {/* CUERPO SUPERIOR BLANCO */}
            <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-grayscale-4/30 dark:bg-grayscale-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grayscale-3/80 pb-3.5 dark:border-grayscale-3/50">
                <span className="text-[12px] text-grayscale-9">Solicitante</span>
                <span className="text-[12.5px] font-medium text-grayscale-12">
                  {nombreLimpio(usuario.nombre)} · {usuario.departamento}
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="titulo" className={ETIQUETA}>
                  Título del requerimiento <span className="text-grayscale-9">*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  maxLength={120}
                  placeholder="Ej. Gotera en el techo del laboratorio 2"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  className="campo w-full px-3.5 py-2.5 text-[13.5px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ubicacion" className={ETIQUETA}>
                  Ubicación física <span className="text-grayscale-9">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ubicacion"
                    type="text"
                    placeholder="Ej. Edificio B · Piso 2, Oficina 204"
                    value={ubicacion}
                    onChange={(event) => setUbicacion(event.target.value)}
                    className="campo w-full py-2.5 pl-9 pr-3.5 text-[13.5px]"
                  />
                  <MapPinIcon
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className={ETIQUETA}>Prioridad estimada</span>
                  <span className="text-[11px] text-grayscale-9">
                    Podrás ajustarla durante la atención
                  </span>
                </div>
                <PriorityPicker value={prioridad} onChange={setPrioridad} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="descripcion" className={ETIQUETA}>
                    Descripción detallada <span className="text-grayscale-9">*</span>
                  </label>
                  <span
                    className={cn(
                      "num font-mono text-[11px]",
                      restantes < 80 ? "text-grayscale-10" : "text-grayscale-9",
                    )}
                  >
                    {descripcion.length}/800
                  </span>
                </div>
                <textarea
                  id="descripcion"
                  rows={5}
                  maxLength={800}
                  placeholder="Describe los síntomas, equipos involucrados, horarios y cualquier antecedente relevante…"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="campo w-full resize-y px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                />
                <p className="text-[11px] text-grayscale-9">
                  La descripción es obligatoria: sin ella no podemos asignar la
                  atención.
                </p>
              </div>
            </div>

            {/* PIE INFERIOR GRIS CONTRASTANTE CON BOTONES */}
            <div className="flex items-center justify-end gap-2.5 px-4 py-2.5">
              <Button type="button" variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={enviando}
                className="px-4"
              >
                {!enviando && <CheckIcon size={14} weight="bold" />}
                <SlotText
                  text={enviando ? "Registrando…" : "Registrar solicitud"}
                  options={{ duration: 260, stagger: 14, bounce: 0.22 }}
                />
              </Button>
            </div>
          </div>
        </form>
      </SkeletonContent>

      <BottomBar
        statusInfo={{
          title: "Nueva ficha de incidencia",
          subtitle:
            "Ingresará como Registrada y quedará disponible en la bandeja técnica.",
        }}
        shortcuts={[
          { key: "Ctrl + Enter", label: "Registrar" },
          { key: "Esc", label: "Cancelar" },
        ]}
      />
    </div>
  );
}
