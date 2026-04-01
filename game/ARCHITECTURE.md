# ERD Game Server — Architecture

## Overview

Lightweight game server that enables browser-based 2-player ERD matches.
Built on the existing Express + Socket.IO stack already in package.json.

## Stack
- **Runtime:** Node.js 18+
- **HTTP:** Express (already installed)
- **Realtime:** Socket.IO (already installed)
- **Data:** JSON files (entities.json, microset.json) — no DB needed yet
- **Frontend:** Vanilla JS + existing erd-site styles

## Directory Structure

```
erd-core/
├── server/
│   ├── index.js          # Express + Socket.IO server entry
│   ├── game-engine.js    # Core game logic (deploy, actions, resolution)
│   ├── matchmaker.js     # Lobby, matchmaking, game creation
│   └── card-loader.js    # Load & validate card data from JSON
├── public/
│   ├── index.html        # Game lobby + matchmaking UI
│   ├── game.html         # In-game play UI
│   ├── js/
│   │   ├── client.js     # Socket.IO client, lobby logic
│   │   └── game-ui.js    # In-game rendering, card interactions
│   └── css/
│       └── game.css      # Game-specific styles
├── data/ -> symlink to ../../erd-site/data/
└── package.json          # (existing)
```

## Game Engine (game-engine.js)

### Game State
```js
{
  id: string,
  phase: 'setup' | 'draw' | 'deploy' | 'action' | 'resolution' | 'finished',
  turn: number,
  maxTurns: 6,
  players: {
    [socketId]: {
      name: string,
      hand: Card[],       // cards in hand
      board: Card[],      // deployed cards
      values: { power: 0, legitimacy: 0, harmony: 0 },
    }
  },
  shared: {
    instability: 0,
    energyFlow: 4,        // scenario-specific
    civilianBurden: 0,    // scenario-specific
  },
  log: string[],          // action history
}
```

### Turn Flow
1. **Draw** — each player draws 2 cards from their deck
2. **Deploy** — each player deploys 0-2 cards from hand to board
3. **Action** — each player chooses 1 action per deployed card
   Actions: Build, Reform, Coordinate, Mobilize, Reveal, Pressure,
   Stabilize, Extract, Invest, Protect, Reconcile, Disrupt
4. **Resolution** — engine calculates value changes, synergies, shared effects
5. **Check** — victory conditions evaluated, advance turn or end game

### Victory Conditions (checked after resolution)
- **Force Victory:** Power >= 10
- **Influence Victory:** Legitimacy >= 10 AND Power >= 5
- **Innovation Victory:** 3+ Technology/Knowledge cards deployed AND Power >= 7
- **Harmony Victory:** Harmony >= 8 AND Instability <= 2 AND Legitimacy >= 5
- **Turn limit:** After maxTurns, highest combined (Power + Legitimacy + Harmony) wins

### Card Effects Engine
Each card has numeric effects from microset.json.
Synergy pairs (e.g. Gandhi + Nonviolence) grant bonus effects.
Effects modify player values and shared state per the resolution rules.

## Matchmaker (matchmaker.js)

- Lobby: players join with a name
- Queue: FIFO matchmaking, pairs first two in queue
- Each player gets a random 8-card deck from the 16-card microset
- Game starts when both players ready

## Socket.IO Events

### Client → Server
- `join_lobby` { name }
- `find_match` { }
- `deploy_cards` { gameId, cardIds[] }
- `choose_actions` { gameId, actions: [{ cardId, action }] }
- `ready` { gameId }

### Server → Client
- `lobby_joined` { playerId }
- `match_found` { gameId, opponent, yourHand }
- `phase_change` { phase, gameState }
- `turn_result` { changes, log, gameState }
- `game_over` { winner, reason, finalState }
- `error` { message }

## First Implementation Scope
1. game-engine.js — pure logic, no I/O
2. card-loader.js — reads microset.json
3. matchmaker.js — lobby + pairing
4. server/index.js — wires Express + Socket.IO + engine + matchmaker
5. Basic HTML/JS client for lobby + gameplay
