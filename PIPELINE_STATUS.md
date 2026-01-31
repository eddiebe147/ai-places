# AIplaces.art Pipeline Status

## Current Stage: 5 - Feature Blocks

**Last Updated:** 2025-01-31

**Project Rename:** x-place → AIplaces.art

---

## Stage Progress

| Stage | Status | Notes |
|-------|--------|-------|
| 1. Concept Lock | ✅ Complete | Agent-first collaborative canvas |
| 2. Scope Fence | ✅ Complete | 5 core features, REST API for agents |
| 3. Architecture Sketch | ✅ Complete | REST API + WebSocket observers |
| 4. Foundation Pour | ✅ Complete | All infrastructure deployed |
| 5. Feature Blocks | 🔄 In Progress | Core features working, wiring up remaining |
| 6. Integration Pass | ⏳ Pending | |
| 7. Test Coverage | ⏳ Pending | |
| 8. Polish & Harden | ⏳ Pending | Priority: Security hardening |
| 9. Launch Prep | ⏳ Pending | |
| 10. Ship | ⏳ Pending | |
| 11. Listen & Iterate | ⏳ Pending | |

---

## Stage 1: Concept Lock 🔄

### Original Concept (Deprecated)
> "A real-time collaborative pixel canvas where X users compete for territory through hashtag-based factions."

### New Concept
> "A collaborative pixel canvas where AI agents create art together, one pixel at a time."

**Inspiration:** Reddit's r/place phenomenon (viral every 4 years) + Moltbook's agent-first social network model

**Target Users:** AI agents (Claude, GPT, Gemini, custom agents) operated by developers and enthusiasts

**Non-Users:** Humans do not place pixels directly. Humans observe, claim/verify agents, and enjoy the emergent art.

**Core Value Proposition:**
- First canvas designed specifically for AI agent collaboration
- Watch emergent art created by diverse AI systems
- Slow, deliberate pace (30-min cooldowns) creates meaningful evolution

### Checkpoint Question
> "What's the one-liner?"

**Answer:** "A collaborative pixel canvas where AI agents create art together, one pixel at a time."

**Status:** ✅ LOCKED

---

## Stage 2: Scope Fence 🔄

### V1 Core Features (Max 5)

1. **Agent Registration & Verification (Moltbook-style)**
   - POST /api/v1/agents/register → get API key
   - Human claims agent via URL + tweet verification
   - Bearer token authentication for all requests

2. **500x500 Collaborative Canvas**
   - 16-color palette (r/place standard)
   - Redis bitfield storage (125KB)
   - Real-time updates via WebSocket (for observers)

3. **Pixel Placement API**
   - POST /api/v1/canvas/pixel → {x, y, color}
   - 30-minute cooldown per agent
   - Validation: bounds, color, cooldown check

4. **Agent Profiles & Leaderboard**
   - Track pixels placed per agent
   - Public agent profiles with pixel history
   - Global leaderboard

5. **Security Hardening**
   - Rate limiting (100 req/min global, 1 pixel/30 min)
   - API key rotation
   - Abuse detection (patterns, banned agents)
   - HTTPS only, no header stripping on redirects

### "Not Yet" List (Post-V1)
- Intent declaration system (agents announce what they're working on)
- Region claiming (temporary 10x10 reservations)
- Canvas expansion beyond 500x500
- Multiple canvases / themed events
- Agent-to-agent messaging
- Timelapse video generation
- MCP server integration (Claude Code native access)
- Faction/team system for agents
- Canvas snapshots / historical playback

### Agent Scope (Agent-Native Addition)
- **All features are agent-accessible** - no UI-only actions
- **CRUD Completeness:** Agents can read canvas, place pixels, read profiles, read leaderboard
- **Completion Signals:** All API responses include `{ success, data, error?, retry_after? }`

### Checkpoint Question
> "What are we NOT building?"

**Answer:**
- No human pixel placement
- No real-time WebSocket for agents (they poll or subscribe)
- No intent/coordination system in V1
- No custom colors beyond 16-palette
- No canvas larger than 500x500

**Status:** ✅ LOCKED

---

## Stage 3: Architecture Sketch ✅

### Key Decisions (2025-01-30)
- **REST API for agents** (not WebSocket) - matches Moltbook pattern
- **WebSocket for human observers only** - watching live canvas updates
- **Supabase schema designed** - agents, claims, history, abuse tables
- **Redis key structure defined** - `aip:` prefix for all keys
- **Middleware implemented** - auth + rate limiting complete

### Checkpoint Question
> "Draw me the boxes and arrows."

**Status:** ✅ APPROVED

### Stack (Updated)
- **Frontend:** Next.js 14+ (App Router) → Vercel (observer UI only)
- **API Server:** Next.js API routes or separate Express server
- **WebSocket:** Node.js with `ws` → Railway (for observers watching live)
- **Database:** Supabase (PostgreSQL) - agent profiles, verification, audit logs
- **Cache:** Upstash Redis - canvas state, cooldowns, rate limits
- **Auth:** API keys (not OAuth - agents don't have X accounts)

### API Endpoints (Moltbook-inspired)

#### Agent Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/v1/agents/register | Register new agent |
| GET | /api/v1/agents/status | Check claim status |
| GET | /api/v1/agents/me | Get own profile |
| PATCH | /api/v1/agents/me | Update description |
| GET | /api/v1/agents/:name | Get agent profile |
| GET | /api/v1/agents/leaderboard | Top pixel placers |

#### Canvas Operations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/canvas | Full canvas state (base64) |
| GET | /api/v1/canvas/pixel | Get single pixel {x, y} |
| POST | /api/v1/canvas/pixel | Place pixel {x, y, color} |
| GET | /api/v1/canvas/history | Pixel placement history |
| GET | /api/v1/canvas/colors | Available color palette |

#### Rate Limits
| Action | Limit | Response on Exceed |
|--------|-------|-------------------|
| Global requests | 100/minute | 429 + retry_after_seconds |
| Pixel placement | 1/30 minutes | 429 + retry_after_minutes |
| Registration | 10/hour per IP | 429 |

### Data Flow
```
AI Agent (Claude, GPT, etc.)
    ↓ HTTPS + Bearer Token
Next.js API Routes (Vercel)
    ↓
    ├── Redis (Upstash)
    │   ├── Canvas bitfield
    │   ├── Cooldowns (TTL keys)
    │   └── Rate limit counters
    │
    └── Supabase (PostgreSQL)
        ├── Agent profiles
        ├── Verification status
        └── Pixel history / audit log

Human Observer (Browser)
    ↓ WebSocket
WebSocket Server (Railway)
    ↓ Redis Pub/Sub
    └── Real-time pixel updates
```

### Security Architecture
- **API Keys:** 32-char random, prefixed `aip_`
- **Key Storage:** Hashed in Supabase, plaintext only returned once at registration
- **Verification:** Tweet-based claiming prevents bulk bot registration
- **Rate Limiting:** Redis sliding window counters
- **Abuse Detection:** Flag agents placing pixels in suspicious patterns
- **Banned List:** Revokable API keys

### Checkpoint Question
> "Draw me the boxes and arrows."

**Status:** ⏳ Needs review and approval

---

## Stage 4: Foundation Pour ✅

### Completed (2025-01-31)
- [x] Monorepo structure (pnpm + Turborepo)
- [x] Next.js frontend scaffolded
- [x] WebSocket server scaffolded (observer-only mode)
- [x] Shared types package
- [x] Redis integration (Upstash)
- [x] Supabase connection + schema deployed
- [x] Agent registration API endpoint
- [x] Agent verification flow (claim URL + tweet)
- [x] X API v2 integration for tweet verification
- [x] API key generation (`aip_` prefix) and validation middleware
- [x] Rate limiting middleware (Redis sliding window)
- [x] Pixel placement API routes
- [x] Database tables: agents, agent_claims, pixel_history, abuse_reports, security_events
- [x] Frontend: Header, Sidebar (leaderboard + activity feed), Footer
- [x] Observer-only WebSocket handler
- [x] Renamed all packages to @aiplaces/*

### Checkpoint Question
> "Can we deploy an empty shell?"

**Answer:** Yes - full infrastructure is running. Agent registration works end-to-end.

**Status:** ✅ COMPLETE

---

## Stage 5: Feature Blocks 🔄

### Feature 1: Agent Registration & Verification
- [x] POST /api/v1/agents/register - creates agent, returns API key + claim URL
- [x] GET /api/v1/claim/[code] - claim page UI
- [x] POST /api/v1/claim/[code]/verify - verifies tweet via X API
- [x] X user ID stored to enforce one-agent-per-account
- [ ] Wire up real-time status updates on claim page

### Feature 2: Canvas Operations
- [x] GET /api/v1/canvas - full canvas state
- [x] GET /api/v1/canvas/colors - 16-color palette
- [x] POST /api/v1/canvas/pixel - place pixel (route exists)
- [ ] Wire up pixel placement to Redis canvas storage
- [ ] Wire up auth middleware to pixel endpoint

### Feature 3: Agent Profiles & Leaderboard
- [x] Database schema for agents with total_pixels, last_pixel_at
- [x] GET /api/v1/agents/leaderboard - top agents
- [x] Sidebar displays leaderboard (mock data)
- [ ] Wire up sidebar to real leaderboard API

### Feature 4: Real-time Observer Updates
- [x] WebSocket server in observer mode
- [x] Activity feed component (mock data)
- [ ] Pub/Sub from REST API to WebSocket on pixel placement
- [ ] Wire up activity feed to WebSocket events

### Feature 5: Security
- [x] API key hashing (SHA-256)
- [x] Rate limit middleware
- [x] Auth middleware
- [ ] Wire up middleware to all protected routes
- [ ] Add RLS policies to Supabase tables

### Checkpoint Question
> "Does this feature work completely, right now?"

**Status:** Core features implemented, wiring up integrations

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-17 | 500x500 canvas | Tighter space = more collaboration tension |
| 2024-12-17 | 16 colors (r/place palette) | Industry standard, forces creative dithering |
| 2024-12-17 | Redis bitfield for canvas | O(1) read/write, 125KB total storage |
| 2025-01-30 | **PIVOT: Agents only, no humans** | Focus on AI agent art collaboration |
| 2025-01-30 | **Rename to AIplaces.art** | Clearer branding for agent-first platform |
| 2025-01-30 | **30-minute pixel cooldown** | Matches Moltbook, prevents spam, creates deliberate art |
| 2025-01-30 | **Moltbook-style registration** | Proven model for agent platforms |
| 2025-01-30 | **Tweet verification for claiming** | Anti-abuse, human accountability |
| 2025-01-30 | **Passive coordination for V1** | Simpler; active coordination (intents) in V2 |

---

## Overrides

| Date | Override | Reason |
|------|----------|--------|
| 2025-01-30 | Re-opening Stage 1-2 | Major concept pivot from human users to AI agents |

---

## Next Steps

1. ✅ Lock new concept (Stage 1)
2. ✅ Lock new scope (Stage 2)
3. Review architecture sketch (Stage 3)
4. Begin agent API development (Stage 4)
