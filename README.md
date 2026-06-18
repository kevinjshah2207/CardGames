# Card Games — Score Keeper

> **Work in progress.** The app is fully functional but still being polished. Public release planned in the coming days.

A mobile scorekeeper for three Indian card games: **Declare**, **Judgement**, and **3 of Spades**. Built with Expo (managed workflow) and TypeScript. iOS and Android.

---

## Games

### 🃏 Declare
Each player holds a hand of cards. Any player can *declare* when they think they have the lowest total. Everyone reveals — if the declarer wins, they score 0. If they lose, they're penalized double the highest hand. Non-declarers either pay their total or score 0 if they tied for the lowest.

### ⚖️ Judgement
A trick-taking bidding game. Cards go from 1 up to a max (52 ÷ players) and back down. Each round, players bid exactly how many tricks they'll win — hit the bid exactly and score bid + 10; miss and score 0. Trump rotates each game in a fixed suit order. The dealer can't make the total bids equal the number of cards dealt.

### ♠️ 3 of Spades
An auction-based trick-taking team game. Players bid on the right to name the trump suit and secretly name partner cards. The winning bidder's team must collect at least their bid in points (3♠ = 30, face cards / aces = 10, 5s = 5). Bidder scores ±2× bid; partners score ±bid; defenders score 0 either way.

---

## Tech

- **Expo SDK** (managed workflow) + **Expo Router** (file-based navigation)
- **TypeScript** — strict mode
- **Zustand** + **AsyncStorage** — all state is local, persisted on-device
- **React Native StyleSheet** — no external UI library

## Running locally

```bash
npm install
npm start          # starts Expo dev server
```

Scan the QR code with [Expo Go](https://expo.dev/go) on iOS or Android. No Xcode or Android Studio required.

## Project structure

```
app/                        # Expo Router screens
  index.tsx                 # Home — game picker
  declare/                  # Declare screens
  judgement/                # Judgement screens
  three-of-spades/          # 3 of Spades screens
lib/
  scoring.ts                # Declare scoring engine
  judgement-scoring.ts      # Judgement scoring engine
  three-of-spades-scoring.ts
  store.ts / *-store.ts     # Zustand stores (persisted)
  types.ts / *-types.ts     # Type definitions
  theme.ts                  # Design tokens (colors, spacing, radius)
components/
  Button.tsx                # Shared button component
```

## License

Copyright (c) 2026 Kevin Shah. All rights reserved. See [LICENSE](LICENSE).
