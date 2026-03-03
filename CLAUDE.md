# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Running Locally

```bash
npm install
npx expo start --android    # or --ios / --web
```

No custom build step. Uses Expo SDK 52 with Expo Router v4.

### Build Commands

```bash
eas build --platform android --profile preview     # APK (internal)
eas build --platform android --profile production   # AAB (store)
npm run lint
```

## Architecture

React Native app built with **Expo SDK 52**, **Expo Router v4** (file-based routing), **Zustand** for state, **Firebase Realtime Database** for backend, and **i18next** for translations (EN/PT).

No test runner is configured.

### Directory Layout

```
app/                    # Expo Router file-based routes
  _layout.tsx           # Root Stack layout, inits auth + i18n
  index.tsx             # Loading/routing guard (redirects based on auth state)
  auth.tsx              # Email/password sign in / sign up
  login.tsx             # Household select / create / join
  setup/                # First-run flows (cat, profiles)
  (tabs)/               # Bottom tab bar (Dashboard, Attacks, Inhaler, Insights)
components/             # Shared UI components + modals/
stores/
  authStore.ts          # Zustand: auth, lang, household selection
  appStore.ts           # Zustand: data, UI state, form fields, all CRUD mutations
services/
  firebase.ts           # Firebase SDK wrappers (DB + Auth), guarded by FB_ON flag
  storage.ts            # AsyncStorage helpers (offline persistence)
hooks/
  useHousehold.ts       # Central derived data selector (memoised)
  useNotifications.ts   # Push notification registration + scheduling
constants/
  colors.ts             # G palette, SEV, SHADOWS, GRADIENTS, PCOLS, EMOJIS
  translations/         # en.json, pt.json
utils/
  data.ts               # Date helpers, ID generators, normalizeData, buildWeeklyData
  defaults.ts           # Default form values and demo data
  i18n.ts               # i18next initialisation
types/
  index.ts              # All TypeScript interfaces
```

### Routing

The root layout (`app/_layout.tsx`) renders a `<Stack>` with all routes. Navigation decisions live in `app/index.tsx` via chained `useEffect` hooks:

- No user -> `/auth`
- No household -> `/login`
- No cats -> `/setup/cat`
- No profiles -> `/setup/profiles`
- Otherwise -> `/(tabs)`

### State Management

Two Zustand stores, consumed with selector functions (`useAppStore((s) => s.modal)`):

- **`authStore`** — `user`, `authReady`, `lang`, `activeHome`, `userHomes`. Key action: `init()` sets up Firebase auth observer.
- **`appStore`** — `data`, `sync`, `modal`, form state. Key action: `doSave(updater, homeKey, uid)` does optimistic local update then `fbSave`.

The **`useHousehold()`** hook derives all per-cat data (attacks, logs, profiles, overdue status) from these stores. Every tab screen uses this hook instead of querying stores directly.

### Firebase

Same Firebase project as the web app (`pawsthma`). The `FB_ON` flag in `services/firebase.ts` is `true` when the API key is real, `false` when it's the placeholder `'PASTE_YOUR_API_KEY_HERE'` (demo/offline mode).

Data paths:
```
pawsthma/users/{uid}        # households map, fcmToken
pawsthma/households/{id}    # full Household object (cats, attacks, profiles, etc.)
pawsthma/invites/{code}     # time-limited invite codes
```

Writes are always full `set()` on the household node (not partial `update()`). Reads use `onValue()` for real-time sync.

### Translations

All UI strings go through i18next (`useTranslation()` hook). Both `en.json` and `pt.json` must be updated when adding new strings. Interpolation uses `{{variable}}` syntax.

### Styling

- All styles use `StyleSheet.create` at the bottom of each file
- Colors come from `constants/colors.ts` (`G` palette object)
- Dark theme only (`userInterfaceStyle: "dark"` in app.json)
- Charts are custom components using `View` with calculated heights (no chart library)
- Modals use `react-native-modal` (bottom sheet slide-up)

### Key Patterns

- **Forms**: State lives in `appStore` (`attackForm`, `inhalerForm`), not local component state. Modals patch the store; on submit, store actions read from `get()` directly.
- **Offline fallback**: When `FB_ON` is false, all data goes through AsyncStorage (`pawsthma_v3` key).
- **No JSX compilation needed**: Standard React Native JSX, handled by Metro bundler.
- **Path alias**: `@/` maps to project root (tsconfig), but most files use relative imports.
