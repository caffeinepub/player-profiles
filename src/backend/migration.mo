import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Nat "mo:core/Nat";

module {
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

  type OldActor = {
    profiles : Map.Map<Principal, PlayerProfile>;
    tournamentEntries : Map.Map<Principal, List.List<TournamentEntry>>;
    nextEntryId : Nat;
  };

  public func run(old : OldActor) : {
    profiles : Map.Map<Principal, PlayerProfile>;
    tournamentEntries : Map.Map<Principal, List.List<TournamentEntry>>;
  } {
    {
      profiles = old.profiles;
      tournamentEntries = old.tournamentEntries;
    };
  };
};
