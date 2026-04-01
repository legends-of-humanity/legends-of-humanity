# ERD Game Design v2 — Resource Economy

## Core Idea

Every card costs RESOURCES to play. Every action costs RESOURCES.
Resources are real-world things: Money, Data, AI, Oil, Forests, Labor, Influence.

You play cards of real people/orgs/ideas. When you click a card, you see the
REAL story — sourced from the open atlas.

The game is the hook. The knowledge is the value.

## 7 Resource Types

| Resource | Icon | What it represents | Color |
|----------|------|-------------------|-------|
| Money 💰 | gold coin | Financial capital, funding | Gold |
| Data 📊 | graph | Information, surveillance, knowledge | Blue |
| AI 🤖 | chip | Artificial intelligence, automation | Purple |
| Oil 🛢️ | barrel | Fossil energy, traditional power | Dark red |
| Forest 🌲 | tree | Ecology, sustainability, natural capital | Green |
| Labor 👷 | person | Human work, workforce, organizing | Orange |
| Influence 📢 | megaphone | Media, narrative, public opinion | Pink |

## Resource Generation

Each turn, players generate resources based on their deployed cards:
- Country cards generate Money + Labor
- Technology cards generate Data + AI
- Resource cards generate Oil or Forest
- Movement cards generate Influence + Labor
- Organization cards generate Money + Influence
- Person cards generate Influence + their specialty

## Card Costs (examples)

| Card | Deploy Cost | Generates per turn |
|------|-----------|-------------------|
| Elon Musk | 💰3 🤖2 | 🤖2 📢1 💰1 |
| BlackRock | 💰5 | 💰3 📊2 |
| Open Source | 📊2 👷1 | 📊1 🤖1 👷1 |
| Amazon Rainforest | 🌲1 | 🌲3 |
| Oil (resource) | 💰2 | 🛢️3 💰1 |
| Gandhi | 👷1 📢1 | 📢3 👷1 |
| Social Media Algorithms | 📊3 🤖2 | 📊2 📢2 🤖1 |
| Whistleblowing | 📢2 | 📢1 📊2 |

## Action Costs

| Action | Cost | Effect |
|--------|------|--------|
| Build | 💰2 👷1 | +2 Power |
| Reform | 💰1 📢1 | +2 Legitimacy, -1 Instability |
| Coordinate | 📢1 👷1 | +1 Legitimacy, +1 Harmony |
| Mobilize | 💰2 🛢️1 | +3 Power, +1 Instability |
| Reveal | 📊2 | +1 Legitimacy, -1 opponent Legitimacy |
| Pressure | 📢2 💰1 | +1 Power, -1 opponent Legitimacy |
| Stabilize | 💰1 🌲1 | +1 Harmony, -2 Instability |
| Extract | 🛢️2 | +3 Power, +1 Instability |
| Invest | 💰3 | +1 Power, +1 Legitimacy |
| Protect | 💰1 👷1 🌲1 | +1 Power, +1 Harmony, -1 Instability |
| Reconcile | 📢1 🌲1 👷1 | +1 Legitimacy, +2 Harmony, -1 Instability |
| Disrupt | 📊2 🤖1 | -1 opponent Power, -1 opponent Legitimacy, +1 Instability |
| Research | 📊1 🤖1 | Draw 1 card |
| Automate | 🤖3 | Replace 2 Labor with 2 AI permanently |

## Starting Resources

Each player starts with:
- 💰 5 Money
- 📊 3 Data
- 🤖 1 AI
- 🛢️ 2 Oil
- 🌲 2 Forest
- 👷 3 Labor
- 📢 2 Influence

## Visual Design

### Card Layout
```
┌─────────────────────┐
│ ★ LEGEND            │  ← rarity
│                     │
│   [PORTRAIT/ICON]   │  ← generated or symbolic art
│                     │
│ ELON MUSK           │  ← name
│ Person · Tech CEO   │  ← type · category
│─────────────────────│
│ Deploy: 💰3 🤖2      │  ← cost
│ Gives:  🤖2 📢1 💰1  │  ← generation
│─────────────────────│
│ "Owns Tesla, SpaceX,│  ← one-liner
│  X, and Neuralink"  │
│                     │
│ [TAP FOR FULL STORY]│  ← link to atlas
│ Power: 8 Leg: 3     │  ← quick stats
└─────────────────────┘
```

### Board Layout
```
┌──────────────────────────────────────────┐
│ OPPONENT: Name          Turn 3/6         │
│ Power:5  Legitimacy:3  Harmony:1         │
│ [card][card][card]  ← opponent board     │
│──────────────────────────────────────────│
│          SHARED: Instability: 2          │
│──────────────────────────────────────────│
│ YOUR BOARD:                              │
│ [card][card]        ← your deployed      │
│──────────────────────────────────────────│
│ RESOURCES: 💰5 📊3 🤖1 🛢️2 🌲2 👷3 📢2    │
│──────────────────────────────────────────│
│ YOUR HAND:                               │
│ [card][card][card][card][card]            │
│──────────────────────────────────────────│
│ [DEPLOY] [ACTIONS] [END TURN]            │
└──────────────────────────────────────────┘
```

## Learning Integration

When you TAP any card:
- Slide-up panel shows the REAL atlas entry
- Sources with clickable links
- Contradictions documented
- Network visualization (who connects to who)
- "Why this matters" explainer

This is the magic: you WANT to read about the entities because
understanding them helps you play better.
