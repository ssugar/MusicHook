# MusicHook

MusicHook is a browser-based music drill SPA built with React + TypeScript. It provides two focused trainers:

- **Treble Clef Trainer** – identify notes from C4 through B5 on a rendered treble staff.
- **Guitar Fretboard Trainer** – in Easy mode locate every occurrence of a requested pitch class on the standard‑tuned 6‑string fretboard (open strings plus frets 1–12); flip on Hard mode to target a specific string.

Progress, streaks, and missions now persist via Firebase (Spark plan) so family members can sign in from GitHub Pages and resume drills without running their own backend.

## Tech Stack

- React 18 with Vite + TypeScript (strict mode)
- React Router v7 for SPA routing
- CSS Modules with a themeable design system (light / dark / high-contrast)
- Vitest + React Testing Library for unit/integration tests
- ESLint (flat config) + Prettier for linting/formatting

## Getting Started

Prerequisites: Node.js ≥ 20.11 and npm ≥ 10.

```bash
npm install
npm run dev        # start development server
npm run build      # production build (outputs to dist/)
npm run preview    # preview the production build
npm test           # run Vitest test suite with coverage
npm run lint       # lint all TypeScript/TSX files
npm run format     # format the project with Prettier
npm run typecheck  # run TypeScript in --noEmit mode
```

## Firebase Setup

1. In the Firebase console create a Web app and copy the config snippet. Paste those values into `src/firebase/config.ts`.
2. Enable **Authentication → Email/Password** and **Cloud Firestore**. Apply the production rules below so each child only sees their own data:

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. (Optional) To run against the Firebase Emulator Suite, start the emulators and launch Vite with `VITE_FIREBASE_USE_EMULATORS=true npm run dev`. The SDK automatically connects to the Auth + Firestore emulators.

Each signed-in user stores aggregated trainer stats at `users/{uid}/progress/{trainerId}` (trainerId is `treble`, `guitar`, or `ukulele`). Documents contain the cumulative attempts, correct count, best streak, and a `lastUpdated` timestamp.

### Missions & Stars

- Missions live on the new `/missions` route (and nav link). Every mission is defined in `src/missions/definitions.ts` with thresholds for attempts, accuracy, or streaks across one or more trainers.
- The UI (`MissionBoard` + `MissionCard`) evaluates the current stats client-side and lets the user record an attempt whenever the requirements are met. Stars (0–3) are derived automatically and stored at `users/{uid}/missions/{missionId}` along with attempt counts and timestamps.
- All progress and mission documents are secured by the same per-user Firestore rules, so siblings cannot see each other’s stats even if they share a device.

## Project Structure

```
src/
  App.tsx                 # Shell, routing, theme management
  components/
    Controls.tsx          # Shared drill controls (mode toggle, stats, timer)
    Fretboard.tsx         # SVG fretboard rendering + interaction layer
    GuitarTrainer.tsx     # Fretboard drill container
    Piano.tsx             # On-screen keyboard input component
    Staff.tsx             # SVG treble staff with ledger lines & accidentals
    TrebleTrainer.tsx     # Staff drill container
  hooks/
    useDrill.ts           # Shared state machine for practice and timed drills
  utils/
    noteUtils.ts          # Music theory helpers (pitch maths, mappings)
    random.ts             # Seedable Mulberry32 RNG helpers
  styles/
    global.css            # Resets, typography, focus styles
    theme.css             # Light, dark, and high-contrast CSS variables
  setupTests.ts           # Testing-library + jest-dom setup
public/
  favicon.svg             # Minimal SVG favicon
  manifest.webmanifest    # Install prompt metadata
```

## Music Mapping Details

The `noteUtils` helpers encode all pitch math:

- Notes use scientific pitch notation. `toMidi` maps each note to MIDI numbers where C0 = 12 (`12 * (octave + 1) + semitone`). Enharmonic spellings are normalised to sharps by `toCanonical`, while `equalPitch` checks equality via MIDI numbers.
- Treble staff placement is calculated relative to E4 (bottom line). Each diatonic step shifts the Y-position by half a staff space, allowing ledger line computation for C4/B5 boundaries.
- Guitar fret positions iterate the six open strings (E2, A2, D3, G3, B3, E4). A fret is valid if `openMidi + fret == targetMidi` with `0 ≤ fret ≤ 12`. All unique playable notes form `GUITAR_SCOPE_NOTES`.
- The guitar trainer drills on pitch classes: `guitarPositionsForPitchClass` returns every matching location (including open strings on the nut) so the UI can highlight all valid answers simultaneously. Hard mode narrows the search to a specific string/position.

These utilities are unit-tested in `noteUtils.test.ts` to lock in enharmonic behaviour and mapping edge cases (e.g., E4 is string 1 fret 0).

## Accessibility & UX

- Full keyboard support: skip link, focus-visible styles, arrow-key fretboard navigation, and keyboard shortcuts for the piano.
- Screen readers receive aria-labels for notes, controls, and dynamically updated feedback via `role="status"`.
- Theme toggle supports light, dark, and high-contrast palettes; the choice is persisted when `localStorage` is available.
- Responsive layout scales from narrow mobile (360px) to desktop.
- Subtle CSS animations provide instant correctness feedback without motion overload (respects `prefers-reduced-motion`).

## Testing

Vitest with React Testing Library covers:

- Music helper functions (`noteUtils.test.ts`)
- Treble trainer flow (correct vs. wrong answers)
- Guitar trainer behaviour in both difficulty modes, including reveal logic
- App routing and basic keyboard navigation

Run `npm test` for the full suite; coverage reports emit to console plus `coverage/`.

## Extending the POC

- Add additional clefs or custom tunings by extending `useDrill` and `noteUtils` data generators.
- Plug in audio playback or persistence later—the architecture keeps rendering logic pure so a future backend or audio engine can be layered on without refactoring core components.

Happy practicing!

## GitHub Pages Deployment

Deployments are automated through GitHub Actions (`.github/workflows/deploy.yml`). On pushes to `main` (or a manual workflow dispatch) the action:

- installs dependencies and runs `npm run build` with `VITE_GH_PAGES_BASE=/MusicHook/`
- uploads the contents of `dist/`
- publishes the artifact to GitHub Pages

After the first successful run, enable GitHub Pages in the repository settings (`Settings → Pages`) and choose “GitHub Actions” as the source. The site will be available at `https://<your-username>.github.io/musichook/`.

Deep links such as `/musichook/treble` use a custom fallback located in `public/404.html`. If you rename the repository or host under a different base path, update the following to keep navigation working:

- `VITE_GH_PAGES_BASE` in `vite.config.ts` (and the workflow environment variable)
- the `targetBase` constant in `public/404.html`

For forks that publish at the root of a `username.github.io` repository or a custom domain, set `VITE_GH_PAGES_BASE=/` and adjust `targetBase` accordingly.
