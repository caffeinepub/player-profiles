import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";
import { Medal } from "lucide-react";
import type { PlayerProfile } from "../backend.d";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { getCountryName, getFlagImgUrl } from "../utils/countries";
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

  // Combine role tags and game tags for display
  const allTagIds = [...(profile.tags ?? []), ...(profile.gameTags ?? [])];

  return (
    <Link
      to="/player/$id"
      params={{ id: ownerId }}
      data-ocid={`index.player.card.${index}`}
      className="group block"
    >
      <article className="relative overflow-hidden rounded-[8px] border border-border bg-card transition-all duration-200 hover:border-primary/50 hover:border-glow-red">
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
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default inline-flex items-center">
                    <img
                      src={getFlagImgUrl(profile.country)}
                      alt={getCountryName(profile.country)}
                      width={24}
                      height={18}
                      className="rounded-sm object-cover"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {getCountryName(profile.country)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Name */}
          <h3 className="font-display font-bold text-base truncate text-foreground group-hover:text-primary transition-colors mb-3">
            {profile.name}
          </h3>

          {/* Tags — icon only with tooltip */}
          {allTagIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TooltipProvider delayDuration={200}>
                {allTagIds.map((tagId) => {
                  const tag = getTag(tagId);
                  if (!tag) return null;
                  return (
                    <Tooltip key={tagId}>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded bg-secondary ${tag.color} cursor-default`}
                        >
                          <tag.Icon className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tag.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
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
