import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type {
  PlayerProfile,
  SocialLinks,
  Trophies,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── Queries ──────────────────────────────────────────────────────────

export function useApprovedProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<PlayerProfile[]>({
    queryKey: ["approvedProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePendingProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<PlayerProfile[]>({
    queryKey: ["pendingProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProfile(owner: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PlayerProfile | null>({
    queryKey: ["profile", owner?.toString()],
    queryFn: async () => {
      if (!actor || !owner) return null;
      try {
        return await actor.getProfile(owner);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!owner,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserRole | null>({
    queryKey: ["callerRole", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      country,
      bio,
      socialLinks,
    }: {
      name: string;
      country: string;
      bio: string;
      socialLinks: SocialLinks;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.createProfile(name, country, bio, socialLinks);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
      void qc.invalidateQueries({ queryKey: ["pendingProfiles"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      country,
      bio,
      socialLinks,
    }: {
      name: string;
      country: string;
      bio: string;
      socialLinks: SocialLinks;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateProfile(name, country, bio, socialLinks);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
      void qc.invalidateQueries({ queryKey: ["pendingProfiles"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useAdminUpdateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      owner,
      name,
      country,
      bio,
      socialLinks,
      tags,
      trophies,
      highlightVideoUrl,
    }: {
      owner: Principal;
      name: string;
      country: string;
      bio: string;
      socialLinks: SocialLinks;
      tags: string[];
      trophies: Trophies;
      highlightVideoUrl: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.adminUpdateProfile(
        owner,
        name,
        country,
        bio,
        socialLinks,
        tags,
        trophies,
        highlightVideoUrl,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
      void qc.invalidateQueries({ queryKey: ["pendingProfiles"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useApproveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (owner: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.approveProfile(owner);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
      void qc.invalidateQueries({ queryKey: ["pendingProfiles"] });
    },
  });
}

export function useRejectProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (owner: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.rejectProfile(owner);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
      void qc.invalidateQueries({ queryKey: ["pendingProfiles"] });
    },
  });
}

export function useSetAvatar() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!actor) throw new Error("Not connected");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await actor.setAvatar(blob);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["approvedProfiles"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      role,
    }: {
      user: Principal;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["isAdmin"] });
      void qc.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}
