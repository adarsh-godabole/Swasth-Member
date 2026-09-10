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
- Tabs: Membership / Plans / Profile under `app/(tabs)`. Plans is a price list
  with a call-the-gym action; Profile shows the member code, every stored field
  with "Not added yet" fallbacks, edit, logout, and account deletion.
- Onboarding: four skippable steps (name/gender/DOB, height/weight/city,
  goal/activity, medical + emergency contact) that PATCH the delta at each step
  and finish with `POST /users/me/onboarding/complete`. Validation ranges mirror
  the backend; empty strings become `null`, never `""`.
- Check-in (added to the brief 2026-08-14): button + client-side confirmation on
  Home under the membership card, hidden unless `subscription.status === 'ACTIVE'`;
  streak / this-month / all-time strip; `/visits` history of the last 30. Double
  tap is a success path (`alreadyCheckedIn: true`), streaks come from the server,
  and `date` is rendered as the gym's day, never through the device timezone.
- Session + workout log (asked for 2026-09-10): checking in now pushes straight
  to `/session`, a screen with a clock running from the server's `checkedInAt`
  and a tappable front/back body map. Selections save on every tap, "Finish
  session" stamps an end (there is still no check-out, so the member ends it),
  and `/workouts` lists every logged day plus a server-computed 30-day tally.
  **The backend for this was built in the same pass** (`Swasth-BE`, commit
  "feat(workouts)"): `PUT /workouts/me/today`, `GET /workouts/me`,
  `GET /workouts/me/summary`. A workout hangs off the check-in, so the gym's day
  rules come for free. The body map is plain Views, not SVG, because
  `react-native-svg` isn't in the graph.
- Backend warmed on launch and on foreground.
- Running on Expo SDK 54 (RN 0.81.5) because iOS Expo Go trails at 54.
  `AGENTS.md` still points at the v57 docs — worth correcting.

## Not done

1. **Not run on a real Android device yet** — verified via `expo export` + curl
   against the deployed backend only. `npx expo start` and scan the QR next.
2. **Offline notice** — `@react-native-community/netinfo` is installed but unused.
3. **Push notifications** — `pushToken` is accepted by `verifyOtp` but nothing
   requests a token yet.
4. **Date of birth** is a plain `YYYY-MM-DD` text field; a native date picker
   would be better.
5. **The workouts backend is only on `main` locally — not deployed.** The app
   defaults to `https://swasth-be.onrender.com`, which has no `/workouts` routes
   until that commit is pushed and `prisma migrate deploy` has run against Neon.
   Until then the session screen's saves will 404.
6. `@expo/vector-icons` could not be installed (its peer graph conflicts with the
   pinned React), so the tab bar is labels-only. Revisit if icons are wanted.

## Live-data gotcha

Both seeded test numbers (`9876543210`, `9845012345`) currently return
`subscription: null`, so they land on the empty membership state rather than the
happy path in the brief. `PATCH /users/me` was verified live: person-level and
gym-level fields can go in one call, and `null` clears a field.
