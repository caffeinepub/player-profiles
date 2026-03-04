import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

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

  type PlayerProfile = {
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
    owner : Principal.Principal;
  };

  type TournamentEntry = {
    id : Nat;
    event : Text;
    earned : Text;
    place : Text;
    link : ?Text;
  };

  public func run(old : {}) : {} {
    let profiles = Map.empty<Principal.Principal, PlayerProfile>();
    let tournamentEntries = Map.empty<Principal.Principal, List.List<TournamentEntry>>();
    {};
  };
};
