# Where this left off

Read `brief.md` first — it is the spec. This file is only the handoff.

## Done (committed, typechecks, bundles for Android)

- Scaffold: Expo 57 / RN 0.86 / TS, Expo Router, TanStack Query, expo-secure-store.
  `app.json` deleted in favour of `app.config.ts`; gym code and base URL live in
  `extra` and are read once in `src/config.ts`.
- `src/api/types.ts` — mirrors brief sections 4–6. Verified field-by-field against
  the live API (`/gyms/current`, `/auth/otp/*`, `/users/me`, `/plans`).
- `src/api/client.ts` — both headers, envelope unwrapping, `ApiError` carrying
  `message`/`statusCode`/`errors`, 90s timeout, single-flight refresh on 401 that
  always stores both rotated tokens, and an `onSlowRequest` signal that fires
  after 5s so screens can say "waking up the gym's server…".
- `src/api/tokens.ts` — refresh token in SecureStore, access token in memory only.
- `src/auth/AuthContext.tsx` — silent restore on cold start; offline is treated as
  still-signed-in, not logged out.
- Screens: `/welcome`, `/login` (phone), `/otp` (auto-advancing boxes, paste
  handling, 60s resend countdown, dev code shown only under `__DEV__`), `/home`
  (all five subscription states incl. the `null` one, `hasRenewalQueued` →
  `coveredUntil`, balance due, staff-account case), `/` routing gate on
  `membership.onboarded`.
- Backend warmed on launch and on foreground.

## Not done

1. **Onboarding** — `app/onboarding.tsx` is a placeholder with a working "skip"
   that calls `POST /users/me/onboarding/complete`. Build the real few-per-screen
   questions (name, gender, DOB, height, weight, goal, activity level, medical
   notes, emergency contact) via `PATCH /users/me`. Mirror the brief's validation
   ranges; send `null` to clear, never `""`.
2. **Plans screen** — `usePlans()` exists, no screen yet. Price list +
   "call the gym" action, clearly not a checkout.
3. **Profile** — view/edit everything, member code prominent, logout
   (`signOut()` is ready), account deletion via `DELETE /users/me` with a
   confirmation. Store-required.
4. **Tab navigation** — home/plans/profile are flat routes right now; move them
   under a `(tabs)` group once plans and profile exist.
5. **Offline notice** — `@react-native-community/netinfo` is installed but unused.
6. **Not verified on a real Android device yet.** Everything above was verified by
   `expo export` + curl against the deployed backend.

## Live-data gotcha

Test member `9876543210` (Rohit Sharma) currently returns `subscription: null` and
`membership.onboarded: false` — so that login lands in onboarding, then the empty
home state, not the happy path the brief's sample JSON shows. `9845012345` is the
one to try for an expiring membership.
