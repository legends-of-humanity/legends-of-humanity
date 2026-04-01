# ERD Governance — Self-Evolving Democracy

## How ERD Evolves

ERD is not controlled by one person. It evolves through community democracy.

## 3 Governance Layers

### 1. Entity Governance (What goes in the Atlas)
- **Anyone** can propose a new entity via GitHub PR or the website
- **Weekly vote** on which proposed entities get added
- **Quality gate**: 2+ sources required, needs_review flag by default
- **Dispute system**: Flag incorrect data, community reviews

### 2. Game Governance (How the game evolves)
- **Monthly balance votes**: Community votes on card balance changes
- **New mechanic proposals**: Anyone can propose new actions, resources, victory conditions
- **Art direction votes**: Which card art style gets used
- **Seasonal updates**: New card sets voted on quarterly

### 3. Fund Governance (Where money goes)
- **Transparent treasury**: All funds visible on-chain
- **Project proposals**: Anyone can submit a peace/harmony project for funding
- **Quadratic voting**: More democratic than simple majority
- **Milestone-based release**: Funds released in stages as projects deliver

## Voting System

### Who Can Vote?
- Anyone with a verified contributor account
- Voting power based on contribution reputation (not money)
- 1 account = 1 base vote
- Bonus vote weight for: verified researchers, active contributors, artists

### Vote Types
| Type | Frequency | Duration | Quorum |
|------|-----------|----------|--------|
| New Entity | Weekly | 48 hours | 10 votes |
| Balance Change | Monthly | 1 week | 25 votes |
| Art Selection | Per card | 1 week | 15 votes |
| Fund Allocation | Quarterly | 2 weeks | 50 votes |
| Rule Change | As needed | 2 weeks | 100 votes |

### Anti-Gaming
- Sybil resistance: GitHub account age + contribution history
- No buying votes
- Transparent vote records
- Cool-down period between proposals from same user

## Artist System

### How Artists Contribute
1. Pick an entity that needs art
2. Create card art following the style guide
3. Upload via GitHub PR or website form
4. Community votes on submissions
5. Winning art becomes the official card
6. Artist credited permanently on the card

### Art Style Guide
- Each card should reflect the CULTURE and TRADITION of the entity
- Gandhi: Indian patterns, saffron/white/green, spinning wheel motifs
- Mandela: African geometric patterns, Ubuntu symbolism
- Turing: Circuit patterns, Enigma references, mathematical beauty
- Oil: Industrial dark tones, pipeline imagery, fire
- Forest: Organic shapes, mycelium networks, green depth
- NO generic AI slop — art should have soul and cultural meaning

### Art Rewards
- Featured artists get contributor reputation
- Top artists invited to create seasonal sets
- Physical card prints credit the artist

## Crypto Integration (Phase 3+)

### Battle Stakes
- Players can wager crypto on matches
- 5% fee goes to Peace Fund
- Winner takes 95%
- Minimum and maximum stake limits

### Peace Fund
- Transparent on-chain treasury
- Community votes on fund allocation
- Eligible projects: peace building, education, open source, ecology, humanitarian
- Projects must submit proof of work
- Milestone-based fund release

### Physical Cards (Phase 4+)
- When treasury reaches threshold → produce physical card sets
- Community votes on which set to print first
- Revenue from sales goes back to Peace Fund
- Limited edition signed by original artists

## Implementation Roadmap

### Now (v0.2)
- [x] GitHub-based contribution (PRs for entities)
- [x] Open source codebase
- [x] Automated entity research

### Next (v0.3)
- [ ] Website with entity proposal form
- [ ] Simple upvote/downvote on entities
- [ ] Artist upload form
- [ ] Basic voting dashboard

### Later (v0.4)
- [ ] On-chain voting (optional)
- [ ] Crypto battle stakes
- [ ] Peace Fund treasury
- [ ] Physical card production planning

### Future (v1.0)
- [ ] Full DAO governance
- [ ] Multi-chain support
- [ ] Global artist marketplace
- [ ] Educational partnerships
- [ ] Physical card distribution
