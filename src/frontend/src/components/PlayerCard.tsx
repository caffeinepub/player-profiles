import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Medal } from "lucide-react";
import type { PlayerProfile } from "../backend.d";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { getCountryName, getFlag } from "../utils/countries";
import { getTag } from "../utils/tags";

interface PlayerCardProps {
  profile: PlayerProfile;
  index: number;
}

export function PlayerCard({ profile, index }: PlayerCardProps) {
  const ownerId = profile.owner.toString();
  const avatarUrl = useAvatarUrl(profile.avatar);

  const gold = Number(profile.trophies.gold);
  const silver = Number(profile.trophies.silver);
  const bronze = Number(profile.trophies.bronze);
  const hasTrophies = gold > 0 || silver > 0 || bronze > 0;

  return (
    <Link
      to="/player/$id"
      params={{ id: ownerId }}
      data-ocid={`index.player.card.${index}`}
      className="group block"
    >
      <article className="relative overflow-hidden rounded border border-border bg-card transition-all duration-200 hover:border-primary/50 hover:border-glow-red">
        {/* Top accent line */}
        <div className="h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full" />

        <div className="p-4">
          {/* Avatar + Country */}
          <div className="flex items-start justify-between mb-3">
            <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/50 transition-all">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name} />}
              <AvatarFallback className="bg-secondary text-foreground font-display font-bold text-lg">
                {profile.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-2xl" title={getCountryName(profile.country)}>
              {getFlag(profile.country)}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-display font-bold text-base truncate text-foreground group-hover:text-primary transition-colors mb-1">
            {profile.name}
          </h3>

          {/* Country name */}
          <p className="text-xs text-muted-foreground mb-3 truncate">
            {getCountryName(profile.country)}
          </p>

          {/* Tags */}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {profile.tags.slice(0, 3).map((tagId) => {
                const tag = getTag(tagId);
                return (
                  <span
                    key={tagId}
                    className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                    title={tag?.label ?? tagId}
                  >
                    {tag?.icon ?? "🏷️"} {tag?.label ?? tagId}
                  </span>
                );
              })}
            </div>
          )}

          {/* Trophies */}
          {hasTrophies && (
            <div className="flex items-center gap-2 text-xs">
              {gold > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-400">
                  <Medal className="h-3 w-3" />
                  {gold}
                </span>
              )}
              {silver > 0 && (
                <span className="flex items-center gap-0.5 text-slate-300">
                  <Medal className="h-3 w-3" />
                  {silver}
                </span>
              )}
              {bronze > 0 && (
                <span className="flex items-center gap-0.5 text-amber-700">
                  <Medal className="h-3 w-3" />
                  {bronze}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
