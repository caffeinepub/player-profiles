export interface TagDef {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const PLAYER_TAGS: TagDef[] = [
  { id: "Toxic", label: "Toxic", icon: "☠️", color: "text-green-400" },
  {
    id: "Supporter",
    label: "Supporter",
    icon: "💚",
    color: "text-emerald-400",
  },
  { id: "Veteran", label: "Veteran", icon: "⚔️", color: "text-yellow-400" },
  { id: "MVP", label: "MVP", icon: "🏆", color: "text-amber-400" },
  { id: "Clutch", label: "Clutch", icon: "💥", color: "text-orange-400" },
  { id: "Sponsor", label: "Sponsor", icon: "💰", color: "text-yellow-300" },
  { id: "Noob", label: "Noob", icon: "🐣", color: "text-pink-400" },
  { id: "Sniper", label: "Sniper", icon: "🎯", color: "text-red-400" },
];

export function getTag(id: string): TagDef | undefined {
  return PLAYER_TAGS.find((t) => t.id === id);
}
