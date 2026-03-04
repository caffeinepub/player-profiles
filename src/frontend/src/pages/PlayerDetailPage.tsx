import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@icp-sdk/core/principal";
import { useParams } from "@tanstack/react-router";
import { ExternalLink, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SiDiscord,
  SiInstagram,
  SiSteam,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";
import type { PlayerProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { getCountryName, getFlag } from "../utils/countries";
import { getTag } from "../utils/tags";

function getVideoEmbed(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Twitch clip
  const twitchClipMatch = url.match(/twitch\.tv\/\w+\/clip\/([\w-]+)/);
  if (twitchClipMatch) {
    return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}&parent=${window.location.hostname}`;
  }

  // Twitch channel
  const twitchChannelMatch = url.match(/twitch\.tv\/([\w]+)(?:\?.*)?$/);
  if (twitchChannelMatch) {
    return `https://player.twitch.tv/?channel=${twitchChannelMatch[1]}&parent=${window.location.hostname}`;
  }

  return null;
}

function TrophyRow({
  gold,
  silver,
  bronze,
}: {
  gold: number;
  silver: number;
  bronze: number;
}) {
  if (gold === 0 && silver === 0 && bronze === 0) {
    return <span className="text-muted-foreground text-sm">None yet</span>;
  }
  return (
    <div className="flex items-center gap-4">
      {gold > 0 && (
        <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
          <Medal className="h-5 w-5" />
          {gold}
          <span className="text-xs font-normal text-muted-foreground">
            Gold
          </span>
        </span>
      )}
      {silver > 0 && (
        <span className="flex items-center gap-1.5 text-slate-300 font-bold">
          <Medal className="h-5 w-5" />
          {silver}
          <span className="text-xs font-normal text-muted-foreground">
            Silver
          </span>
        </span>
      )}
      {bronze > 0 && (
        <span className="flex items-center gap-1.5 text-amber-700 font-bold">
          <Medal className="h-5 w-5" />
          {bronze}
          <span className="text-xs font-normal text-muted-foreground">
            Bronze
          </span>
        </span>
      )}
    </div>
  );
}

function SocialLinks({ links }: { links: PlayerProfile["socialLinks"] }) {
  const items = [
    {
      key: "twitch",
      url: links.twitch,
      icon: <SiTwitch className="h-5 w-5" />,
      label: "Twitch",
      color: "hover:text-purple-400",
    },
    {
      key: "youtube",
      url: links.youtube,
      icon: <SiYoutube className="h-5 w-5" />,
      label: "YouTube",
      color: "hover:text-red-500",
    },
    {
      key: "twitter",
      url: links.twitter,
      icon: <SiX className="h-5 w-5" />,
      label: "Twitter/X",
      color: "hover:text-foreground",
    },
    {
      key: "instagram",
      url: links.instagram,
      icon: <SiInstagram className="h-5 w-5" />,
      label: "Instagram",
      color: "hover:text-pink-400",
    },
    {
      key: "steam",
      url: links.steam,
      icon: <SiSteam className="h-5 w-5" />,
      label: "Steam",
      color: "hover:text-sky-400",
    },
    {
      key: "discord",
      url: links.discord,
      icon: <SiDiscord className="h-5 w-5" />,
      label: "Discord",
      color: "hover:text-indigo-400",
    },
  ].filter((item) => !!item.url);

  if (items.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">No links added</span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {items.map(({ key, url, icon, label, color }) => (
        <a
          key={key}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          className={`text-muted-foreground transition-colors ${color}`}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}

export function PlayerDetailPage() {
  const { id } = useParams({ from: "/player/$id" });
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl(profile?.avatar);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    let principal: Principal;
    try {
      principal = Principal.fromText(id);
    } catch {
      setError("Invalid player ID");
      setLoading(false);
      return;
    }

    actor
      .getProfile(principal)
      .then((p) => {
        setProfile(p);
        setLoading(false);
      })
      .catch(() => {
        setError("Player not found");
        setLoading(false);
      });
  }, [actor, isFetching, id]);

  if (loading || isFetching) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex gap-6 mb-8">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64 mt-4" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="player.error_state"
        >
          <p className="text-destructive font-medium text-lg">
            {error ?? "Player not found"}
          </p>
        </div>
      </main>
    );
  }

  const embedUrl = profile.highlightVideoUrl
    ? getVideoEmbed(profile.highlightVideoUrl)
    : null;

  return (
    <main
      className="mx-auto max-w-4xl px-4 py-8"
      data-ocid="player.detail.section"
    >
      {/* Hero */}
      <section className="flex flex-col sm:flex-row gap-6 mb-8">
        <Avatar className="h-28 w-28 ring-2 ring-border shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name} />}
          <AvatarFallback className="bg-secondary text-foreground font-display font-black text-3xl">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-3xl font-display font-black text-foreground">
              {profile.name}
            </h1>
            <span className="text-2xl" title={getCountryName(profile.country)}>
              {getFlag(profile.country)}
            </span>
          </div>

          <p className="text-muted-foreground text-sm mb-3">
            {getCountryName(profile.country)}
          </p>

          {/* Tags */}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.tags.map((tagId) => {
                const tag = getTag(tagId);
                return (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {tag?.icon ?? "🏷️"} {tag?.label ?? tagId}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Social */}
          <SocialLinks links={profile.socialLinks} />
        </div>
      </section>

      <Separator className="mb-6" />

      {/* Details grid */}
      <section className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Player Details
          </h2>
          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Trophies
          </h2>
          <TrophyRow
            gold={Number(profile.trophies.gold)}
            silver={Number(profile.trophies.silver)}
            bronze={Number(profile.trophies.bronze)}
          />
        </div>
      </section>

      {/* Highlight video */}
      {profile.highlightVideoUrl && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Highlight Video
          </h2>
          {embedUrl ? (
            <div className="aspect-video w-full rounded overflow-hidden border border-border">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title={`${profile.name} highlight`}
              />
            </div>
          ) : (
            <a
              href={profile.highlightVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Watch video
            </a>
          )}
        </section>
      )}
    </main>
  );
}
