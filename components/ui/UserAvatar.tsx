"use client";

import { Avatar } from "@avatune/react";
import pacovqzzTheme from "@avatune/pacovqzz-theme/react";
import { cn } from "@/helpers/classname-helper";
import { iniciales } from "@/helpers/iniciales";

/**
 * Rasgos definidos con el estilo de @avatune/pacovqzz-theme para cada miembro del equipo.
 * Si se pasa un id o nombre no mapeado, se deriva una semilla determinista estable.
 */
interface PersonaTraitConfig {
  hair?: "curly" | "curlyBandana" | "long" | "longBeanie" | "medium" | "mediumCap" | "mohawk" | "short";
  eyes?: "apathetic" | "glasses" | "heartSunglasses" | "matrixSunglasses" | "opened" | "roundSunglasses" | "standard";
  mouth?: "apathetic" | "beard" | "bristle1" | "bristle2" | "confused" | "happy" | "meh" | "mustache";
  body?: "hoodie" | "overall" | "overshirt1" | "overshirt2" | "pufferJacket" | "tshirt1" | "tshirt2";
  backgroundColor?: string;
}

const PERSONAS: Record<string, PersonaTraitConfig> = {
  // Ing. Beatriz Vargas (Jefa de Operaciones)
  "jef-1": {
    hair: "curly",
    eyes: "opened",
    mouth: "happy",
    body: "overshirt1",
    backgroundColor: "#FD8575",
  },
  // Roberto Silva (Técnico Especialista)
  "tec-1": {
    hair: "short",
    eyes: "opened",
    mouth: "bristle1",
    body: "tshirt2",
    backgroundColor: "#79ACE9",
  },
  // Carlos Méndez (Analista de Calidad)
  "emp-a": {
    hair: "short",
    eyes: "glasses",
    mouth: "happy",
    body: "overshirt2",
    backgroundColor: "#E7B431",
  },
  // Lucía Morales (Investigadora Senior)
  "emp-b": {
    hair: "long",
    eyes: "opened",
    mouth: "happy",
    body: "hoodie",
    backgroundColor: "#F4A464",
  },
};

interface UserAvatarProps {
  userId?: string;
  name?: string;
  size?: number;
  className?: string;
  fallbackInitials?: string;
}

export function UserAvatar({
  userId,
  name,
  size = 32,
  className,
  fallbackInitials,
}: UserAvatarProps) {
  const persona = (userId && PERSONAS[userId]) ?? undefined;
  const seed = userId || name || "avatune-user";
  const displayInitials = fallbackInitials ?? (name ? iniciales(name) : "");

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Avatar
        theme={pacovqzzTheme}
        size={size}
        seed={persona ? undefined : seed}
        {...persona}
      />
      {displayInitials ? (
        <span className="sr-only">{displayInitials}</span>
      ) : null}
    </div>
  );
}

