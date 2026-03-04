# Player Profiles

## Current State
The app has an admin system powered by `_initializeAccessControlWithSecret(token)`. The token is currently read only from a URL hash parameter (`caffeineAdminToken`). A logged-in user must visit the app URL with `#caffeineAdminToken=<token>` appended to claim admin. There is no in-app UI to enter this token manually.

## Requested Changes (Diff)

### Add
- New `/admin-setup` route and `AdminSetupPage` component
- The page lets a logged-in user type in the admin token to claim admin in-app (no URL tricks needed)
- On submit, calls `actor._initializeAccessControlWithSecret(token)` then checks `isCallerAdmin()` to confirm success
- Shows success state (with link to /admin) or error state if token is wrong
- Shows a "not logged in" prompt if the user is not authenticated

### Modify
- `App.tsx`: register the new `/admin-setup` route
- `Navbar.tsx`: add a subtle "Admin Setup" link (visible only when user is logged in but not yet admin), or keep it undiscoverable via URL only -- implement as URL-only (no nav link, to keep it clean)

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/AdminSetupPage.tsx` with:
   - Login gate (prompt to log in if not authenticated)
   - "Already admin" state (redirect info if `isAdmin` is already true)
   - Token input form with submit button
   - Loading state during submission
   - Success state with link to /admin panel
   - Error state if token is rejected
2. Register `/admin-setup` route in `App.tsx`
