# Player Profiles

## Current State
Full player profile app with Internet Identity auth, profile management, admin panel, tournament records, tags, and trophies. The admin setup flow uses `_initializeAccessControlWithSecret` which compares the user-entered token against the `CAFFEINE_ADMIN_TOKEN` environment variable. The problem is twofold:
1. The real env var value is unknown to the owner; the hardcoded UUID from a previous session was never actually set as that env var.
2. If the user already logged in once (registered as `#user`), the `initialize` function does nothing because their principal is already in the map.

## Requested Changes (Diff)

### Add
- A hardcoded owner secret (`019cb7e3-667a-71ff-954e-6e1423ec37ad`) in `MixinAuthorization` that, when matched, unconditionally sets the caller's role to `#admin` and sets `adminAssigned = true`, bypassing both the env var check and the "already registered" guard.

### Modify
- `MixinAuthorization.mo`: add owner-secret fast path at the top of `_initializeAccessControlWithSecret` before the env var switch.

### Remove
- Nothing.

## Implementation Plan
1. Regenerate backend Motoko with the owner-secret override in the authorization mixin.
2. No frontend changes needed -- AdminSetupPage already calls `_initializeAccessControlWithSecret` with whatever token the user types.
