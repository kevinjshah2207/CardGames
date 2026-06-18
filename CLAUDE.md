# CardGames — CLAUDE.md

## Project
A cross-platform mobile app (iOS + Android) for scoring the card game **Declare**. Built with Expo (managed workflow) + TypeScript.

## Stack
- **Expo SDK 56** (managed), **Expo Router** (file-based navigation)
- **TypeScript** — strict mode
- **Zustand** + **AsyncStorage** — local-only state, persisted to device
- **React Native StyleSheet** — no NativeWind/Tailwind (peer dep conflict with Expo 56)
- **expo-haptics** — haptic feedback on key interactions
- No backend, no auth, no cloud sync — everything lives on device

## Testing on device
- Primary: iPhone via **Expo Go** (scan QR from `npm start`, no Xcode required)
- Secondary: Android via Expo Go

## Project structure
```
app/                    # Expo Router screens
  _layout.tsx           # Root stack config (dark theme)
  index.tsx             # Home
  history.tsx           # All games list
  stats.tsx             # Per-player stats
  rules.tsx             # Declare rules
  game/
    new.tsx             # Player setup
    [id].tsx            # Live scoreboard
    [id]/round.tsx      # Round entry + live preview
lib/
  types.ts              # Player, Game, Round, RoundEntry, RoundScore
  scoring.ts            # Pure scoring engine (no side effects)
  store.ts              # Zustand store (persisted)
  theme.ts              # colors, radius, spacing constants
components/
  Button.tsx            # Shared button (primary/secondary/danger/ghost)
```

## Declare — game rules (canonical source of truth)

### Card values
- Jack = **0**
- Ace = **1**
- 2–10 = face value
- Q, K = **10**

### A round
1. Each player holds cards; sum = hand total.
2. Any player can **declare** when they think they have the lowest total.
3. All players reveal.

### Scoring algorithm (`lib/scoring.ts`)
```
declarerWins = (declarerTotal === 0) OR (declarerTotal < min(all other totals))

For each player:
  if declarer:
    score = declarerWins ? 0 : 2 × max(all hand totals this round)
  else if declarerWon:
    score = player.handTotal   // everyone pays their total
  else:
    // declarer lost — non-declarers tied for the LOWEST among non-declarers get 0
    score = (player.handTotal === min(non-declarer totals)) ? 0 : player.handTotal
```

**Special rules:**
- A declarer with total **0 can never lose**, even if another player also has 0.
- When the declarer loses, the declarer is **excluded** from the lowest-total comparison — only non-declarers compete for the 0.
- Multiple non-declarers tied for lowest all get 0.

### Game end
- Open-ended (manual). Lowest cumulative total wins.
- 6+ players: use 2 decks (app shows a hint, doesn't enforce).

## Coding conventions
- **No comments** unless the why is genuinely non-obvious.
- **No unnecessary abstractions** — if something is used once, inline it.
- **No error handling for impossible states** — trust TypeScript and internal invariants.
- Screens own their layout; shared UI goes in `components/`.
- Theme values always come from `lib/theme.ts` — no magic numbers.
- Haptic feedback: `Light` for taps, `Success`/`Warning` for confirmations.

## User preferences
- Concise responses — no trailing summaries of what was done.
- Efficient implementation — no padding, verbosity, or over-engineering.
- No agent hooks needed for this project.
