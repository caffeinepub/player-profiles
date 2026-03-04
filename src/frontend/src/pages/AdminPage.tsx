import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Loader2,
  Medal,
  Pencil,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  PlayerProfile,
  SocialLinks,
  TournamentEntry,
  Trophies,
} from "../backend.d";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAdminAddTournamentEntry,
  useAdminDeleteTournamentEntry,
  useAdminEditTournamentEntry,
  useAdminUpdateProfile,
  useApproveProfile,
  useApprovedProfiles,
  useIsAdmin,
  usePendingProfiles,
  useRejectProfile,
  useTournamentEntries,
} from "../hooks/useQueries";
import { COUNTRIES, getCountryName, getFlagImgUrl } from "../utils/countries";
import { ROLE_TAGS, getTag } from "../utils/tags";

// ── Mini profile row ───────────────────────────────────────────────────

function ProfileRow({
  profile,
  index,
  showApprove,
  showReject,
  onEdit,
}: {
  profile: PlayerProfile;
  index: number;
  showApprove?: boolean;
  showReject?: boolean;
  onEdit: (profile: PlayerProfile) => void;
}) {
  const approve = useApproveProfile();
  const reject = useRejectProfile();
  const avatarUrl = useAvatarUrl(profile.avatar);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded border border-border bg-card hover:border-primary/30 transition-colors"
      data-ocid={`admin.profile.row.${index}`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="bg-secondary font-display font-bold text-sm">
          {profile.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{profile.name}</p>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <img
            src={getFlagImgUrl(profile.country)}
            alt={getCountryName(profile.country)}
            width={18}
            height={13}
            className="rounded-sm object-cover"
          />
          {getCountryName(profile.country)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {showApprove && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-green-400 hover:bg-green-400/10"
            disabled={approve.isPending}
            onClick={() =>
              approve
                .mutateAsync(profile.owner)
                .then(() => toast.success(`${profile.name} approved`))
                .catch(() => toast.error("Failed to approve"))
            }
            data-ocid={`admin.approve_button.${index}`}
            title="Approve"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {showReject && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
            disabled={reject.isPending}
            onClick={() =>
              reject
                .mutateAsync(profile.owner)
                .then(() => toast.success(`${profile.name} rejected`))
                .catch(() => toast.error("Failed to reject"))
            }
            data-ocid={`admin.reject_button.${index}`}
            title="Reject"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(profile)}
          data-ocid={`admin.delete_button.${index}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Edit Dialog ────────────────────────────────────────────────────────

function EditProfileDialog({
  profile,
  open,
  onClose,
}: {
  profile: PlayerProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  const adminUpdate = useAdminUpdateProfile();
  const addEntry = useAdminAddTournamentEntry();
  const editEntry = useAdminEditTournamentEntry();
  const deleteEntry = useAdminDeleteTournamentEntry();

  const { data: tournamentEntries, isLoading: entriesLoading } =
    useTournamentEntries(profile?.owner ?? null);

  const [name, setName] = useState(profile?.name ?? "");
  const [country, setCountry] = useState(profile?.country || "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [highlightUrl, setHighlightUrl] = useState(
    profile?.highlightVideoUrl ?? "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    profile?.tags ?? [],
  );
  const [gold, setGold] = useState(String(profile?.trophies.gold ?? 0));
  const [silver, setSilver] = useState(String(profile?.trophies.silver ?? 0));
  const [bronze, setBronze] = useState(String(profile?.trophies.bronze ?? 0));

  // Competition Record form state
  const [entryEvent, setEntryEvent] = useState("");
  const [entryEarned, setEntryEarned] = useState("");
  const [entryPlace, setEntryPlace] = useState("");
  const [entryLink, setEntryLink] = useState("");
  const [editingEntry, setEditingEntry] = useState<TournamentEntry | null>(
    null,
  );

  // Reset state whenever the profile changes (dialog opens for a different player)
  const profileKey = profile?.owner?.toString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on profile identity change
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCountry(profile.country || "");
      setBio(profile.bio);
      setHighlightUrl(profile.highlightVideoUrl ?? "");
      setSelectedTags([...profile.tags]);
      setGold(String(profile.trophies.gold));
      setSilver(String(profile.trophies.silver));
      setBronze(String(profile.trophies.bronze));
      // Reset competition form on profile change
      setEntryEvent("");
      setEntryEarned("");
      setEntryPlace("");
      setEntryLink("");
      setEditingEntry(null);
    }
  }, [profileKey]);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  function startEditEntry(entry: TournamentEntry) {
    setEditingEntry(entry);
    setEntryEvent(entry.event);
    setEntryEarned(entry.earned);
    setEntryPlace(entry.place);
    setEntryLink(entry.link ?? "");
  }

  function cancelEditEntry() {
    setEditingEntry(null);
    setEntryEvent("");
    setEntryEarned("");
    setEntryPlace("");
    setEntryLink("");
  }

  async function handleAddOrSaveEntry() {
    if (!profile || !entryEvent.trim()) return;
    try {
      if (editingEntry) {
        await editEntry.mutateAsync({
          owner: profile.owner,
          entryId: editingEntry.id,
          event: entryEvent.trim(),
          earned: entryEarned.trim(),
          place: entryPlace.trim(),
          link: entryLink.trim() || null,
        });
        toast.success("Entry updated");
      } else {
        await addEntry.mutateAsync({
          owner: profile.owner,
          event: entryEvent.trim(),
          earned: entryEarned.trim(),
          place: entryPlace.trim(),
          link: entryLink.trim() || null,
        });
        toast.success("Entry added");
      }
      cancelEditEntry();
    } catch {
      toast.error(
        editingEntry ? "Failed to update entry" : "Failed to add entry",
      );
    }
  }

  async function handleDeleteEntry(entryId: bigint) {
    if (!profile) return;
    try {
      await deleteEntry.mutateAsync({ owner: profile.owner, entryId });
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  async function handleSave() {
    if (!profile) return;
    const trophies: Trophies = {
      gold: BigInt(Number(gold) || 0),
      silver: BigInt(Number(silver) || 0),
      bronze: BigInt(Number(bronze) || 0),
    };
    try {
      await adminUpdate.mutateAsync({
        owner: profile.owner,
        name,
        country,
        bio,
        socialLinks: profile.socialLinks,
        tags: selectedTags,
        trophies,
        highlightVideoUrl: highlightUrl || null,
      });
      toast.success("Profile updated");
      onClose();
    } catch {
      toast.error("Failed to update profile");
    }
  }

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            Edit: {profile.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label className="text-xs">Country</Label>
            <Select
              value={country || "__none__"}
              onValueChange={(v) => setCountry(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="__none__">-- Select country --</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="inline-flex items-center gap-2">
                      <img
                        src={getFlagImgUrl(c.code)}
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
          </div>

          {/* Role Tags (admin assigns) */}
          <div className="space-y-2">
            <Label className="text-xs">Role Tags</Label>
            <div className="flex flex-wrap gap-2" data-ocid="admin.tags.select">
              {ROLE_TAGS.map((tag) => (
                <label
                  key={tag.id}
                  htmlFor={`tag-${tag.id}`}
                  className="flex items-center gap-2 cursor-pointer text-sm rounded border border-border bg-secondary/30 px-2.5 py-1.5 hover:border-primary/40 transition-colors"
                >
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <span
                    className={`inline-flex items-center justify-center h-4 w-4 ${tag.color}`}
                  >
                    <tag.Icon className="h-4 w-4" />
                  </span>
                  <span>{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Game Tags (read-only for admin) */}
          {profile.gameTags && profile.gameTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Player&apos;s Game Tags (read-only)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <TooltipProvider delayDuration={200}>
                  {profile.gameTags.map((tagId) => {
                    const tag = getTag(tagId);
                    if (!tag) return null;
                    return (
                      <Tooltip key={tagId}>
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary border border-border text-xs ${tag.color}`}
                          >
                            <tag.Icon className="h-3.5 w-3.5" />
                            {tag.label}
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
            </div>
          )}

          {/* Game Tags empty state */}
          {(!profile.gameTags || profile.gameTags.length === 0) && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Player&apos;s Game Tags (read-only)
              </Label>
              <p className="text-xs text-muted-foreground italic">
                No game tags selected by player.
              </p>
            </div>
          )}

          {/* Trophies */}
          <div className="space-y-2">
            <Label className="text-xs">Trophies</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-yellow-400">Gold</Label>
                <Input
                  type="number"
                  min="0"
                  value={gold}
                  onChange={(e) => setGold(e.target.value)}
                  data-ocid="admin.trophies.gold.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Silver</Label>
                <Input
                  type="number"
                  min="0"
                  value={silver}
                  onChange={(e) => setSilver(e.target.value)}
                  data-ocid="admin.trophies.silver.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-amber-700">Bronze</Label>
                <Input
                  type="number"
                  min="0"
                  value={bronze}
                  onChange={(e) => setBronze(e.target.value)}
                  data-ocid="admin.trophies.bronze.input"
                />
              </div>
            </div>
          </div>

          {/* Highlight video */}
          <div className="space-y-1.5">
            <Label className="text-xs">Highlight Video URL</Label>
            <Input
              value={highlightUrl}
              onChange={(e) => setHighlightUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Competition Record */}
          <Separator className="my-2" />
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Competition Record
            </Label>

            {/* Entry list */}
            {entriesLoading ? (
              <div
                className="space-y-2"
                data-ocid="admin.competition.loading_state"
              >
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ) : !tournamentEntries || tournamentEntries.length === 0 ? (
              <p
                className="text-xs text-muted-foreground italic"
                data-ocid="admin.competition.empty_state"
              >
                No entries yet.
              </p>
            ) : (
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs py-2">Event</TableHead>
                      <TableHead className="text-xs py-2">Earned</TableHead>
                      <TableHead className="text-xs py-2">Place</TableHead>
                      <TableHead className="text-xs py-2 w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentEntries.map((entry, i) => (
                      <TableRow
                        key={String(entry.id)}
                        className="border-border hover:bg-secondary/40"
                        data-ocid={`admin.competition.row.${i + 1}`}
                      >
                        <TableCell className="text-xs py-2 max-w-[120px] truncate">
                          {entry.link ? (
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {entry.event}
                            </a>
                          ) : (
                            entry.event
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">
                          {entry.earned || "—"}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          {entry.place === "1" ? (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Medal className="h-3 w-3" /> 1st
                            </span>
                          ) : entry.place === "2" ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Medal className="h-3 w-3" /> 2nd
                            </span>
                          ) : entry.place === "3" ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Medal className="h-3 w-3" /> 3rd
                            </span>
                          ) : (
                            entry.place
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => startEditEntry(entry)}
                              data-ocid={`admin.competition.entry.edit_button.${i + 1}`}
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              disabled={deleteEntry.isPending}
                              onClick={() => handleDeleteEntry(entry.id)}
                              data-ocid={`admin.competition.entry.delete_button.${i + 1}`}
                              title="Delete"
                            >
                              {deleteEntry.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add / Edit form */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground font-medium">
                {editingEntry ? "Edit Entry" : "Add Entry"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={entryEvent}
                  onChange={(e) => setEntryEvent(e.target.value)}
                  placeholder="Event name"
                  className="text-xs h-8"
                  data-ocid="admin.competition.event.input"
                />
                <Input
                  value={entryEarned}
                  onChange={(e) => setEntryEarned(e.target.value)}
                  placeholder="e.g. $20, item"
                  className="text-xs h-8"
                  data-ocid="admin.competition.earned.input"
                />
                <Input
                  value={entryPlace}
                  onChange={(e) => setEntryPlace(e.target.value)}
                  placeholder="e.g. 1, 2, 4th, DNF"
                  className="text-xs h-8"
                  data-ocid="admin.competition.place.input"
                />
              </div>
              <Input
                value={entryLink}
                onChange={(e) => setEntryLink(e.target.value)}
                placeholder="Link URL (optional)"
                className="text-xs h-8"
                data-ocid="admin.competition.link.input"
              />
              <div className="flex items-center gap-2">
                {editingEntry ? (
                  <>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground"
                      disabled={!entryEvent.trim() || editEntry.isPending}
                      onClick={handleAddOrSaveEntry}
                      data-ocid="admin.competition.save_button"
                    >
                      {editEntry.isPending && (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      )}
                      Save
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      onClick={cancelEditEntry}
                      data-ocid="admin.competition.cancel_button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-primary text-primary-foreground"
                    disabled={!entryEvent.trim() || addEntry.isPending}
                    onClick={handleAddOrSaveEntry}
                    data-ocid="admin.competition.add_button"
                  >
                    {addEntry.isPending && (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    )}
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={adminUpdate.isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="admin.save_button"
          >
            {adminUpdate.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main AdminPage ────────────────────────────────────────────────────

export function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingProfiles, isLoading: pendingLoading } =
    usePendingProfiles();
  const { data: approvedProfiles, isLoading: approvedLoading } =
    useApprovedProfiles();

  const [editProfile, setEditProfile] = useState<PlayerProfile | null>(null);

  if (!identity) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-display font-black mb-2">Admin Area</h1>
        <p className="text-muted-foreground text-sm">
          Please log in to access the admin panel.
        </p>
      </main>
    );
  }

  if (adminLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-display font-black mb-2 text-destructive">
          Access Denied
        </h1>
        <p className="text-muted-foreground text-sm">
          You don't have admin privileges.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-display font-black text-foreground">
          Admin Panel
        </h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" data-ocid="admin.pending.tab">
            Pending{" "}
            {pendingProfiles && pendingProfiles.length > 0 && (
              <span className="ml-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {pendingProfiles.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-ocid="admin.approved.tab">
            Approved
          </TabsTrigger>
        </TabsList>

        {/* Pending */}
        <TabsContent value="pending">
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          ) : pendingProfiles?.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="admin.pending.empty_state"
            >
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No pending profiles.
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="admin.pending.list">
              {pendingProfiles?.map((profile, i) => (
                <ProfileRow
                  key={profile.owner.toString()}
                  profile={profile}
                  index={i + 1}
                  showApprove
                  showReject
                  onEdit={setEditProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved */}
        <TabsContent value="approved">
          {approvedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          ) : approvedProfiles?.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="admin.approved.empty_state"
            >
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No approved profiles yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvedProfiles?.map((profile, i) => (
                <ProfileRow
                  key={profile.owner.toString()}
                  profile={profile}
                  index={i + 1}
                  showReject
                  onEdit={setEditProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <EditProfileDialog
        profile={editProfile}
        open={!!editProfile}
        onClose={() => setEditProfile(null)}
      />
    </main>
  );
}
