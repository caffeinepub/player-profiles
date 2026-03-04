import {
  BadgeDollarSign,
  Crosshair,
  Shield,
  Skull,
  Sparkles,
  Star,
  Sword,
} from "lucide-react";
import { createElement } from "react";
import type React from "react";

export interface TagDef {
  id: string;
  label: string;
  category: "role" | "game";
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// ── Role Tags (admin-assigned) ────────────────────────────────────────

export const ROLE_TAGS: TagDef[] = [
  {
    id: "Toxic",
    label: "Toxic",
    category: "role",
    color: "text-green-400",
    Icon: Skull,
  },
  {
    id: "Admin",
    label: "Admin",
    category: "role",
    color: "text-blue-400",
    Icon: Shield,
  },
  {
    id: "Veteran",
    label: "Veteran",
    category: "role",
    color: "text-yellow-400",
    Icon: Sword,
  },
  {
    id: "Drama Queen",
    label: "Drama Queen",
    category: "role",
    color: "text-pink-400",
    Icon: Sparkles,
  },
  {
    id: "Sponsor",
    label: "Sponsor",
    category: "role",
    color: "text-yellow-300",
    Icon: BadgeDollarSign,
  },
  {
    id: "Aim Bot",
    label: "Aim Bot",
    category: "role",
    color: "text-red-400",
    Icon: Crosshair,
  },
  {
    id: "Pro",
    label: "Pro",
    category: "role",
    color: "text-amber-400",
    Icon: Star,
  },
];

// ── Game tag text-badge components ────────────────────────────────────

function makeTextIcon(
  text: string,
): React.ComponentType<{ className?: string }> {
  function TextIcon({ className }: { className?: string }) {
    return createElement(
      "span",
      {
        className: `font-display font-black leading-none ${className ?? ""}`,
        style: { fontSize: "0.65rem", letterSpacing: "0.02em" },
      },
      text,
    );
  }
  TextIcon.displayName = `TextIcon(${text})`;
  return TextIcon;
}

// ── Game Tags (player self-assignable) ────────────────────────────────

export const GAME_TAGS: TagDef[] = [
  {
    id: "Quake",
    label: "Quake",
    category: "game",
    color: "text-orange-500",
    Icon: makeTextIcon("Q"),
  },
  {
    id: "Xonotic",
    label: "Xonotic",
    category: "game",
    color: "text-cyan-400",
    Icon: makeTextIcon("XN"),
  },
  {
    id: "Warsow",
    label: "Warsow",
    category: "game",
    color: "text-purple-400",
    Icon: makeTextIcon("WS"),
  },
  {
    id: "Red Eclipse",
    label: "Red Eclipse",
    category: "game",
    color: "text-red-400",
    Icon: makeTextIcon("RE"),
  },
  {
    id: "Reflex Arena",
    label: "Reflex Arena",
    category: "game",
    color: "text-sky-400",
    Icon: makeTextIcon("RA"),
  },
  {
    id: "Diabotical",
    label: "Diabotical",
    category: "game",
    color: "text-lime-400",
    Icon: makeTextIcon("DB"),
  },
  {
    id: "Toxikk",
    label: "Toxikk",
    category: "game",
    color: "text-emerald-400",
    Icon: makeTextIcon("TX"),
  },
];

// ── Combined ─────────────────────────────────────────────────────────

export const PLAYER_TAGS: TagDef[] = [...ROLE_TAGS, ...GAME_TAGS];

export function getTag(id: string): TagDef | undefined {
  return PLAYER_TAGS.find((t) => t.id === id);
}
