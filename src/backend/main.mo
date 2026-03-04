import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type ProfileStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type SocialLinks = {
    discord : ?Text;
    twitch : ?Text;
    youtube : ?Text;
    twitter : ?Text;
    steam : ?Text;
    instagram : ?Text;
  };

  type Trophies = {
    gold : Nat;
    silver : Nat;
    bronze : Nat;
  };

  public type PlayerProfile = {
    name : Text;
    country : Text;
    bio : Text;
    socialLinks : SocialLinks;
    tags : [Text];
    trophies : Trophies;
    highlightVideoUrl : ?Text;
    avatar : ?Storage.ExternalBlob;
    status : ProfileStatus;
    owner : Principal;
  };

  // Internal state
  let profiles = Map.empty<Principal, PlayerProfile>();

  module PlayerProfile {
    public func compareByOwner(profile1 : PlayerProfile, profile2 : PlayerProfile) : Order.Order {
      Principal.compare(profile1.owner, profile2.owner);
    };
  };

  public shared ({ caller }) func createProfile(
    name : Text,
    country : Text,
    bio : Text,
    socialLinks : SocialLinks,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };

    if (profiles.containsKey(caller)) {
      Runtime.trap("Profile already exists");
    };

    let profile : PlayerProfile = {
      name;
      country;
      bio;
      socialLinks;
      tags = [];
      trophies = {
        gold = 0;
        silver = 0;
        bronze = 0;
      };
      highlightVideoUrl = null;
      avatar = null;
      status = #pending;
      owner = caller;
    };

    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile(owner : Principal) : async PlayerProfile {
    switch (profiles.get(owner)) {
      case (?profile) {
        // Allow access if:
        // 1. Profile is approved (public)
        // 2. Caller is the owner (can see own profile regardless of status)
        // 3. Caller is admin (can see all profiles)
        if (profile.status == #approved or caller == owner or AccessControl.isAdmin(accessControlState, caller)) {
          profile
        } else {
          Runtime.trap("Unauthorized: Profile is not approved");
        };
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public query ({ caller }) func getApprovedProfiles() : async [PlayerProfile] {
    let approvedProfiles = List.empty<PlayerProfile>();
    for (profile in profiles.values()) {
      if (profile.status == #approved) {
        approvedProfiles.add(profile);
      };
    };
    approvedProfiles.toArray();
  };

  public query ({ caller }) func getPendingProfiles() : async [PlayerProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending profiles");
    };
    let pendingProfiles = List.empty<PlayerProfile>();
    for (profile in profiles.values()) {
      if (profile.status == #pending) {
        pendingProfiles.add(profile);
      };
    };
    pendingProfiles.toArray();
  };

  public shared ({ caller }) func updateProfile(
    name : Text,
    country : Text,
    bio : Text,
    socialLinks : SocialLinks,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    switch (profiles.get(caller)) {
      case (?existingProfile) {
        let updatedProfile : PlayerProfile = {
          name;
          country;
          bio;
          socialLinks;
          tags = existingProfile.tags;
          trophies = existingProfile.trophies;
          highlightVideoUrl = existingProfile.highlightVideoUrl;
          avatar = existingProfile.avatar;
          status = #pending; // Reset to pending on update
          owner = caller;
        };
        profiles.add(caller, updatedProfile);
      };
      case (null) { Runtime.trap("Profile does not exist") };
    };
  };

  public shared ({ caller }) func adminUpdateProfile(
    owner : Principal,
    name : Text,
    country : Text,
    bio : Text,
    socialLinks : SocialLinks,
    tags : [Text],
    trophies : Trophies,
    highlightVideoUrl : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update other profiles");
    };

    switch (profiles.get(owner)) {
      case (?existingProfile) {
        let updatedProfile : PlayerProfile = {
          name;
          country;
          bio;
          socialLinks;
          tags;
          trophies;
          highlightVideoUrl;
          avatar = existingProfile.avatar;
          status = existingProfile.status;
          owner;
        };
        profiles.add(owner, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func approveProfile(owner : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can approve");
    };

    switch (profiles.get(owner)) {
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          country = profile.country;
          bio = profile.bio;
          socialLinks = profile.socialLinks;
          tags = profile.tags;
          trophies = profile.trophies;
          highlightVideoUrl = profile.highlightVideoUrl;
          avatar = profile.avatar;
          status = #approved;
          owner = profile.owner;
        };
        profiles.add(owner, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func rejectProfile(owner : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can reject");
    };

    switch (profiles.get(owner)) {
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          country = profile.country;
          bio = profile.bio;
          socialLinks = profile.socialLinks;
          tags = profile.tags;
          trophies = profile.trophies;
          highlightVideoUrl = profile.highlightVideoUrl;
          avatar = profile.avatar;
          status = #rejected;
          owner = profile.owner;
        };
        profiles.add(owner, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func setAvatar(avatar : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set avatars");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          country = profile.country;
          bio = profile.bio;
          socialLinks = profile.socialLinks;
          tags = profile.tags;
          trophies = profile.trophies;
          highlightVideoUrl = profile.highlightVideoUrl;
          avatar = ?avatar;
          status = profile.status;
          owner = profile.owner;
        };
        profiles.add(caller, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };
};
