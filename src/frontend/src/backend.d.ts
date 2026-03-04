import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PlayerProfile {
    bio: string;
    status: ProfileStatus;
    country: string;
    owner: Principal;
    socialLinks: SocialLinks;
    name: string;
    tags: Array<string>;
    highlightVideoUrl?: string;
    trophies: Trophies;
    avatar?: ExternalBlob;
}
export interface SocialLinks {
    twitch?: string;
    twitter?: string;
    instagram?: string;
    steam?: string;
    discord?: string;
    youtube?: string;
}
export interface Trophies {
    bronze: bigint;
    gold: bigint;
    silver: bigint;
}
export enum ProfileStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminUpdateProfile(owner: Principal, name: string, country: string, bio: string, socialLinks: SocialLinks, tags: Array<string>, trophies: Trophies, highlightVideoUrl: string | null): Promise<void>;
    approveProfile(owner: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProfile(name: string, country: string, bio: string, socialLinks: SocialLinks): Promise<void>;
    getApprovedProfiles(): Promise<Array<PlayerProfile>>;
    getCallerUserRole(): Promise<UserRole>;
    getPendingProfiles(): Promise<Array<PlayerProfile>>;
    getProfile(owner: Principal): Promise<PlayerProfile>;
    isCallerAdmin(): Promise<boolean>;
    rejectProfile(owner: Principal): Promise<void>;
    setAvatar(avatar: ExternalBlob): Promise<void>;
    updateProfile(name: string, country: string, bio: string, socialLinks: SocialLinks): Promise<void>;
}
