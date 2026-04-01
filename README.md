# ERD: Legends of Humanity

**Collect humanity. Play history.**

An open-source transparency atlas tracking global power structures — who has power, where the money flows, and what they do with it.

## What is ERD?

ERD turns real-world people, organizations, ideas, movements, technologies, and resources into source-backed collectible cards. Every claim is sourced. Every relationship is mapped. Every contradiction is documented.

It's not just a card game. It's a layered system:

1. **The Atlas** — A structured, source-backed knowledge base of global power
2. **The Cards** — Beautiful, collectible representations of entities that shape our world
3. **The Game** — A strategy game where power, legitimacy, and harmony matter
4. **The Movement** — An open-source community making power transparent

## Why?

Because the world doesn't need more information. It needs better ways to:
- See who actually holds power
- Follow where money flows
- Understand how systems connect
- Think critically about the structures that shape our lives

## Quick Start

```bash
# Clone
git clone https://github.com/legends-of-humanity/legends-of-humanity.git
cd legends-of-humanity

# Run the game server
cd game
npm install
node server/index.js
# Open http://localhost:3000
```

## Entity Schema

Every entity in ERD tracks:
- **Identity** — Who/what it is, with aliases and categorization
- **Power Profile** — Net worth, revenue, influence regions, key positions, political donations, media ownership
- **Network** — Allies, adversaries, funding relationships, memberships, subsidiaries
- **Accountability** — Legal issues, sanctions, human rights record, transparency score
- **Sources** — Every claim backed by verifiable references

See [data/schema.json](data/schema.json) for the complete schema.

## Current Data

- 18 core entities (historical figures, ideas, movements)
- 16 power structure entities (systems, resources, institutions)
- 16 playable cards with game mechanics
- Entity relationship network

## The Game

ERD features a real-time multiplayer card game with:
- **8 card types**: Country, Leader, Resource, Technology, Idea, Movement, Institution, Event
- **4 victory conditions**: Force, Influence, Innovation, Harmony
- **12 action types**: Build, Reform, Coordinate, Mobilize, Reveal, Pressure, Stabilize, Extract, Invest, Protect, Reconcile, Disrupt
- **Core philosophy**: Domination wins short-term. Peace is harder but stronger long-term.

## Contributing

We need help with:
- **Research** — Adding new entities with proper sources
- **Verification** — Fact-checking existing entries
- **Data** — Improving the knowledge graph
- **Code** — Game engine, atlas UI, visualizations
- **Translation** — Making ERD accessible worldwide

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Principles

- **Source everything** — No claims without evidence
- **Document contradictions** — Truth is complex
- **Transparency scores** — Rate how transparent each entity is
- **Community review** — All data flagged for review by default
- **Trust before money** — Build legitimacy first

## License

MIT — Free to use, fork, and build upon.

## Contact

- Email: legends-of-humanity@proton.me
- GitHub: [legends-of-humanity](https://github.com/legends-of-humanity)
