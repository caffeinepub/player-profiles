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
    gameTags : [Text];
    trophies : Trophies;
    highlightVideoUrl : ?Text;
    avatar : ?Storage.ExternalBlob;
    status : ProfileStatus;
    owner : Principal;
  };

  public type TournamentEntry = {
    id : Nat;
    event : Text;
    earned : Text;
    place : Text;
    link : ?Text;
  };

  // Internal state
  let profiles = Map.empty<Principal, PlayerProfile>();
  let tournamentEntries = Map.empty<Principal, List.List<TournamentEntry>>();
  var nextEntryId : Nat = 0;

  module PlayerProfile {
    public func compareByOwner(profile1 : PlayerProfile, profile2 : PlayerProfile) : Order.Order {
      Principal.compare(profile1.owner, profile2.owner);
    };
  };

  /// Helper function to check if caller is anonymous.
  func isAnonymous(caller : Principal) : Bool {
    caller.isAnonymous();
  };

  // Required frontend user profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?PlayerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?PlayerProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless admin");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : PlayerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    // Ensure the profile owner matches the caller
    if (profile.owner != caller) {
      Runtime.trap("Unauthorized: Cannot save profile for another user");
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func createProfile(
    name : Text,
    country : Text,
    bio : Text,
    socialLinks : SocialLinks,
  ) : async () {
    // Allow non-anonymous callers, regardless of user role
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot create profiles");
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
      gameTags = [];
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
    // Allow only non-anonymous callers who are the owner of a profile
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot update profiles");
    };

    switch (profiles.get(caller)) {
      case (?existingProfile) {
        let updatedProfile : PlayerProfile = {
          name;
          country;
          bio;
          socialLinks;
          tags = existingProfile.tags;
          gameTags = existingProfile.gameTags;
          trophies = existingProfile.trophies;
          highlightVideoUrl = existingProfile.highlightVideoUrl;
          avatar = existingProfile.avatar;
          status = existingProfile.status; // Preserve existing status
          owner = caller;
        };
        profiles.add(caller, updatedProfile);
      };
      case (null) { Runtime.trap("Profile does not exist") };
    };
  };

  public shared ({ caller }) func updateGameTags(gameTags : [Text]) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot update game tags");
    };

    switch (profiles.get(caller)) {
      case (?existingProfile) {
        let updatedProfile : PlayerProfile = {
          name = existingProfile.name;
          country = existingProfile.country;
          bio = existingProfile.bio;
          socialLinks = existingProfile.socialLinks;
          tags = existingProfile.tags;
          gameTags;
          trophies = existingProfile.trophies;
          highlightVideoUrl = existingProfile.highlightVideoUrl;
          avatar = existingProfile.avatar;
          status = existingProfile.status;
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
          gameTags = existingProfile.gameTags;
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
          gameTags = profile.gameTags;
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
          gameTags = profile.gameTags;
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
    // Allow non-anonymous callers with an existing profile
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous callers cannot set avatars");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          country = profile.country;
          bio = profile.bio;
          socialLinks = profile.socialLinks;
          tags = profile.tags;
          gameTags = profile.gameTags;
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

  public shared ({ caller }) func deleteProfile(owner : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete profiles");
    };

    switch (profiles.get(owner)) {
      case (?_profile) {
        profiles.remove(owner);
        // Also remove tournament entries for this player
        tournamentEntries.remove(owner);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  // Tournament Entry Functions

  public query ({ caller }) func getTournamentEntries(owner : Principal) : async [TournamentEntry] {
    // Public query, no authorization required
    switch (tournamentEntries.get(owner)) {
      case (?entries) { entries.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func adminAddTournamentEntry(
    owner : Principal,
    event : Text,
    earned : Text,
    place : Text,
    link : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add tournament entries");
    };

    let newEntry : TournamentEntry = {
      id = nextEntryId;
      event;
      earned;
      place;
      link;
    };

    nextEntryId += 1;

    switch (tournamentEntries.get(owner)) {
      case (?existingEntries) {
        existingEntries.add(newEntry);
        tournamentEntries.add(owner, existingEntries);
      };
      case (null) {
        let newList = List.empty<TournamentEntry>();
        newList.add(newEntry);
        tournamentEntries.add(owner, newList);
      };
    };
  };

  public shared ({ caller }) func adminEditTournamentEntry(
    owner : Principal,
    entryId : Nat,
    event : Text,
    earned : Text,
    place : Text,
    link : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit tournament entries");
    };

    switch (tournamentEntries.get(owner)) {
      case (?entries) {
        var found = false;
        let updatedEntries = List.empty<TournamentEntry>();

        var i = 0;
        while (i < entries.size()) {
          let entry = entries.at(i);
          if (entry.id == entryId) {
            found := true;
            let updatedEntry : TournamentEntry = {
              id = entryId;
              event;
              earned;
              place;
              link;
            };
            updatedEntries.add(updatedEntry);
          } else {
            updatedEntries.add(entry);
          };
          i += 1;
        };

        if (not found) {
          Runtime.trap("Tournament entry not found");
        };

        tournamentEntries.add(owner, updatedEntries);
      };
      case (null) {
        Runtime.trap("Tournament entry not found");
      };
    };
  };

  public shared ({ caller }) func adminDeleteTournamentEntry(
    owner : Principal,
    entryId : Nat,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete tournament entries");
    };

    switch (tournamentEntries.get(owner)) {
      case (?entries) {
        var found = false;
        let updatedEntries = List.empty<TournamentEntry>();

        var i = 0;
        while (i < entries.size()) {
          let entry = entries.at(i);
          if (entry.id == entryId) {
            found := true;
            // Skip this entry (delete it)
          } else {
            updatedEntries.add(entry);
          };
          i += 1;
        };

        if (not found) {
          Runtime.trap("Tournament entry not found");
        };

        tournamentEntries.add(owner, updatedEntries);
      };
      case (null) {
        Runtime.trap("Tournament entry not found");
      };
    };
  };
};
