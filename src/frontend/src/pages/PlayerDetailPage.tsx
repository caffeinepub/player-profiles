import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
// Simple markdown renderer (no external dependency)
function SimpleMarkdown({ children }: { children: string }) {
  const html = children
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/^(?!<[hulo])(.+)$/gm, (m) =>
      m.startsWith("<") ? m : `<p>${m}</p>`,
    );
  // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional markdown render
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
import type { PlayerProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { useTournamentEntries } from "../hooks/useQueries";
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
  const linkItems = [
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
  ].filter((item) => !!item.url);

  const hasDiscord = !!links.discord;
  const hasAny = linkItems.length > 0 || hasDiscord;

  if (!hasAny) {
    return (
      <span className="text-muted-foreground text-sm">No links added</span>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-3">
        {linkItems.map(({ key, url, icon, label, color }) => (
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
        {hasDiscord && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground hover:text-indigo-400 transition-colors cursor-default">
                <SiDiscord className="h-5 w-5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {links.discord}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

function PlaceDisplay({ place }: { place: string }) {
  if (place === "1") {
    return (
      <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
        <Medal className="h-4 w-4" />
        <span className="text-xs">1st</span>
      </span>
    );
  }
  if (place === "2") {
    return (
      <span className="flex items-center gap-1.5 text-slate-300 font-bold">
        <Medal className="h-4 w-4" />
        <span className="text-xs">2nd</span>
      </span>
    );
  }
  if (place === "3") {
    return (
      <span className="flex items-center gap-1.5 text-amber-600 font-bold">
        <Medal className="h-4 w-4" />
        <span className="text-xs">3rd</span>
      </span>
    );
  }
  return <span className="text-sm text-foreground">{place}</span>;
}

export function PlayerDetailPage() {
  const { id } = useParams({ from: "/player/$id" });
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl(profile?.avatar);

  // Parse principal once to use for tournament query
  const ownerPrincipal = (() => {
    try {
      return Principal.fromText(id);
    } catch {
      return null;
    }
  })();

  const { data: tournamentEntries } = useTournamentEntries(ownerPrincipal);

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
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h1 className="text-3xl font-display font-black text-foreground">
              {profile.name}
            </h1>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl cursor-default">
                    {getFlag(profile.country)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {getCountryName(profile.country)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tags — icon only with tooltip */}
          {(() => {
            const allTagIds = [
              ...(profile.tags ?? []),
              ...(profile.gameTags ?? []),
            ];
            if (allTagIds.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 mb-4">
                <TooltipProvider delayDuration={200}>
                  {allTagIds.map((tagId) => {
                    const tag = getTag(tagId);
                    if (!tag) return null;
                    return (
                      <Tooltip key={tagId}>
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center justify-center h-7 w-7 rounded bg-secondary border border-border ${tag.color} cursor-default transition-colors hover:border-primary/50`}
                          >
                            <tag.Icon className="h-4 w-4" />
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
            );
          })()}

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
            <div className="prose prose-sm prose-invert max-w-none text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground">
              <SimpleMarkdown>{profile.bio}</SimpleMarkdown>
            </div>
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

      {/* Competition Record */}
      <section className="mb-8" data-ocid="player.competition.section">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Competition Record
        </h2>
        {!tournamentEntries || tournamentEntries.length === 0 ? (
          <p
            className="text-sm text-muted-foreground italic"
            data-ocid="player.competition.empty_state"
          >
            No competition record yet.
          </p>
        ) : (
          <div className="rounded-[8px] border border-border overflow-hidden">
            <Table data-ocid="player.competition.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[50%]">
                    Event
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Earned
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Place
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentEntries.map((entry, i) => (
                  <TableRow
                    key={String(entry.id)}
                    className="border-border hover:bg-secondary/40 transition-colors"
                    data-ocid={`player.competition.row.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm text-foreground">
                      {entry.link ? (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                        >
                          {entry.event}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        entry.event
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.earned || "—"}
                    </TableCell>
                    <TableCell>
                      <PlaceDisplay place={entry.place} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  );
}
