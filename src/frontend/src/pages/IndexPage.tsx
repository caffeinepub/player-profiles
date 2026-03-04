import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { useApprovedProfiles } from "../hooks/useQueries";
import { getCountryName, getFlagImgUrl } from "../utils/countries";
import { GAME_TAGS } from "../utils/tags";

export function IndexPage() {
  const { data: profiles, isLoading } = useApprovedProfiles();
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [trophyFilter, setTrophyFilter] = useState<string>("all");
  const [gameTagFilter, setGameTagFilter] = useState<string>("all");

  // Unique countries present in profiles
  const presentCountries = useMemo(() => {
    if (!profiles) return [];
    const codes = [...new Set(profiles.map((p) => p.country.toUpperCase()))];
    return codes
      .map((code) => ({
        code,
        name: getCountryName(code),
        flagUrl: getFlagImgUrl(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles]);

  // Game tags that have at least one player
  const presentGameTags = useMemo(() => {
    if (!profiles) return [];
    const usedIds = new Set(profiles.flatMap((p) => p.gameTags ?? []));
    return GAME_TAGS.filter((tag) => usedIds.has(tag.id));
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!profiles) return [];
    let result = profiles;
    if (countryFilter !== "all") {
      result = result.filter(
        (p) => p.country.toUpperCase() === countryFilter.toUpperCase(),
      );
    }
    if (trophyFilter !== "all") {
      result = result.filter((p) => {
        const gold = Number(p.trophies.gold);
        const silver = Number(p.trophies.silver);
        const bronze = Number(p.trophies.bronze);
        if (trophyFilter === "any") return gold > 0 || silver > 0 || bronze > 0;
        if (trophyFilter === "gold") return gold > 0;
        if (trophyFilter === "silver") return silver > 0;
        if (trophyFilter === "bronze") return bronze > 0;
        return true;
      });
    }
    if (gameTagFilter !== "all") {
      result = result.filter((p) => (p.gameTags ?? []).includes(gameTagFilter));
    }
    return result;
  }, [profiles, countryFilter, trophyFilter, gameTagFilter]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-4xl font-display font-black text-foreground mb-2">
          PLAYER <span className="text-primary text-glow-red">ROSTER</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {profiles?.length ?? 0} registered players
        </p>
      </section>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label
          htmlFor="country-filter"
          className="text-sm text-muted-foreground font-medium"
        >
          Country:
        </label>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger
            id="country-filter"
            className="w-52"
            data-ocid="index.country_filter.select"
          >
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            <SelectItem value="all">🌍 All countries</SelectItem>
            {presentCountries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="inline-flex items-center gap-2">
                  <img
                    src={c.flagUrl}
                    alt={c.name}
                    width={20}
                    height={15}
                    className="rounded-sm object-cover inline-block"
                  />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label
          htmlFor="trophy-filter"
          className="text-sm text-muted-foreground font-medium"
        >
          Trophies:
        </label>
        <Select value={trophyFilter} onValueChange={setTrophyFilter}>
          <SelectTrigger
            id="trophy-filter"
            className="w-44"
            data-ocid="index.trophy_filter.select"
          >
            <SelectValue placeholder="All players" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            <SelectItem value="any">🏅 Has trophies</SelectItem>
            <SelectItem value="gold">🥇 Has gold</SelectItem>
            <SelectItem value="silver">🥈 Has silver</SelectItem>
            <SelectItem value="bronze">🥉 Has bronze</SelectItem>
          </SelectContent>
        </Select>

        {presentGameTags.length > 0 && (
          <>
            <label
              htmlFor="game-filter"
              className="text-sm text-muted-foreground font-medium"
            >
              Game:
            </label>
            <Select value={gameTagFilter} onValueChange={setGameTagFilter}>
              <SelectTrigger
                id="game-filter"
                className="w-44"
                data-ocid="index.game_filter.select"
              >
                <SelectValue placeholder="All games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All games</SelectItem>
                {presentGameTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center h-4 w-4 ${tag.color}`}
                      >
                        <tag.Icon className="h-4 w-4" />
                      </span>
                      {tag.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Player grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          data-ocid="index.players.list"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"].map(
            (k) => (
              <Skeleton key={k} className="h-44 rounded" />
            ),
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="index.players.empty_state"
        >
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">
            {countryFilter !== "all"
              ? "No players from this country yet."
              : "No approved players yet."}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          data-ocid="index.players.list"
        >
          {filtered.map((profile, i) => (
            <PlayerCard
              key={profile.owner.toString()}
              profile={profile}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}
