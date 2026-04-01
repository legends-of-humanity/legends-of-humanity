# Contributing to ERD: Legends of Humanity

Thank you for wanting to help make global power structures more transparent.

## How to Contribute

### Adding New Entities

1. Fork this repo
2. Create a new branch: `git checkout -b add-entity/entity-name`
3. Add your entity to `data/entities.json` following `data/schema.json`
4. Every claim needs a source (URL preferred)
5. Mark `needs_review: true` in the meta field
6. Submit a Pull Request

### Entity Quality Standards

- **2-3 credible sources minimum** per entity
- **No unsourced claims** — if you can't source it, mark it as uncertain
- **Document contradictions** — real power is complex
- **Transparency score** must be justified
- **Neutral tone** — document facts, not opinions

### Types of Contributions We Need

| Type | Description | Difficulty |
|------|-------------|------------|
| Research | Add new entities with sources | Easy |
| Verification | Fact-check existing entries | Easy |
| Relationships | Map connections between entities | Medium |
| Code | Game engine, UI, visualizations | Medium-Hard |
| Translation | Translate entities and UI | Easy-Medium |
| Design | Card art, UI/UX improvements | Medium |

### Code Contributions

- Game engine: `game/server/`
- Data: `data/`
- Docs: `docs/`

### What We Don't Accept

- Unsourced claims
- Conspiracy theories without evidence
- Content that promotes hatred
- SEO spam or self-promotion
- Entities added purely for political attack without balanced documentation

## Code of Conduct

Be respectful. Argue with evidence, not emotion. This project exists to increase understanding, not to attack individuals.

## Questions?

Open an issue or email legends-of-humanity@proton.me
