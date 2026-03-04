import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SocialLinks } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAvatarUrl } from "../hooks/useAvatarUrl";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateProfile,
  useProfile,
  useSetAvatar,
  useUpdateProfile,
} from "../hooks/useQueries";
import { COUNTRIES } from "../utils/countries";

export function RegisterPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { isFetching } = useActor();

  const principal = identity?.getPrincipal() ?? null;
  const { data: existingProfile, isLoading: profileLoading } =
    useProfile(principal);
  const avatarUrl = useAvatarUrl(existingProfile?.avatar);

  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const setAvatar = useSetAvatar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [twitch, setTwitch] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [steam, setSteam] = useState("");
  const [discord, setDiscord] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const isEditing = !!existingProfile;

  // Populate form from existing profile
  useEffect(() => {
    if (existingProfile) {
      setName(existingProfile.name);
      setCountry(existingProfile.country);
      setBio(existingProfile.bio);
      setTwitch(existingProfile.socialLinks.twitch ?? "");
      setYoutube(existingProfile.socialLinks.youtube ?? "");
      setTwitter(existingProfile.socialLinks.twitter ?? "");
      setInstagram(existingProfile.socialLinks.instagram ?? "");
      setSteam(existingProfile.socialLinks.steam ?? "");
      setDiscord(existingProfile.socialLinks.discord ?? "");
    }
  }, [existingProfile]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);

    // Upload
    try {
      await setAvatar.mutateAsync(file);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !country) {
      toast.error("Name and country are required.");
      return;
    }

    const socialLinks: SocialLinks = {
      twitch: twitch || undefined,
      youtube: youtube || undefined,
      twitter: twitter || undefined,
      instagram: instagram || undefined,
      steam: steam || undefined,
      discord: discord || undefined,
    };

    try {
      if (isEditing) {
        await updateProfile.mutateAsync({ name, country, bio, socialLinks });
        toast.success("Profile updated!");
      } else {
        await createProfile.mutateAsync({ name, country, bio, socialLinks });
        toast.success("Profile created! Awaiting admin approval.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (!identity) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-display font-black mb-4">
          Login to Register
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          You need to log in with Internet Identity to create a player profile.
        </p>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="nav.login_button"
          className="bg-primary text-primary-foreground"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {isLoggingIn ? "Connecting..." : "Login"}
        </Button>
      </main>
    );
  }

  if (profileLoading || isFetching) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </main>
    );
  }

  const isMutating = createProfile.isPending || updateProfile.isPending;
  const currentAvatarDisplay = avatarPreview ?? avatarUrl;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-3xl font-display font-black mb-1 text-foreground">
        {isEditing ? "Edit Profile" : "Register Profile"}
      </h1>
      {existingProfile && (
        <p className="text-xs text-muted-foreground mb-6 capitalize">
          Status:{" "}
          <span
            className={
              existingProfile.status === "approved"
                ? "text-green-400"
                : existingProfile.status === "rejected"
                  ? "text-destructive"
                  : "text-yellow-400"
            }
          >
            {existingProfile.status}
          </span>
        </p>
      )}

      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-2 ring-border">
            {currentAvatarDisplay && (
              <AvatarImage src={currentAvatarDisplay} alt="Your avatar" />
            )}
            <AvatarFallback className="bg-secondary font-display font-black text-2xl">
              {name ? name.slice(0, 2).toUpperCase() : "??"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
            aria-label="Upload avatar"
            data-ocid="player.avatar.upload_button"
          >
            <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Avatar</p>
          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
          {setAvatar.isPending && (
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        data-ocid="register.form"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your gamer tag"
            required
            data-ocid="register.name.input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">
            Country <span className="text-destructive">*</span>
          </Label>
          <Select value={country} onValueChange={setCountry} required>
            <SelectTrigger id="country" data-ocid="register.country.input">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-xs">
            Social Links
          </p>
          {[
            {
              id: "twitch",
              label: "Twitch URL",
              value: twitch,
              setter: setTwitch,
            },
            {
              id: "youtube",
              label: "YouTube URL",
              value: youtube,
              setter: setYoutube,
            },
            {
              id: "twitter",
              label: "Twitter/X URL",
              value: twitter,
              setter: setTwitter,
            },
            {
              id: "instagram",
              label: "Instagram URL",
              value: instagram,
              setter: setInstagram,
            },
            { id: "steam", label: "Steam URL", value: steam, setter: setSteam },
            {
              id: "discord",
              label: "Discord (tag or server)",
              value: discord,
              setter: setDiscord,
            },
          ].map(({ id, label, value, setter }) => (
            <div key={id} className="space-y-1">
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={id}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder="https://..."
                className="text-sm"
              />
            </div>
          ))}
        </div>

        <Button
          type="submit"
          disabled={isMutating}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="register.submit_button"
        >
          {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isMutating
            ? "Saving..."
            : isEditing
              ? "Update Profile"
              : "Create Profile"}
        </Button>
      </form>
    </main>
  );
}
