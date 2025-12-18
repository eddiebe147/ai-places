# X-Place Pipeline Status

## Current Stage: 4 - Foundation Pour

**Last Updated:** 2024-12-17

---

## Stage Progress

| Stage | Status | Notes |
|-------|--------|-------|
| 1. Concept Lock | ✅ Complete | Real-time collaborative canvas with X integration |
| 2. Scope Fence | ✅ Complete | 500x500 canvas, 16 colors, faction system |
| 3. Architecture Sketch | ✅ Complete | Next.js + Node WS + Supabase + Redis |
| 4. Foundation Pour | 🔄 In Progress | Scaffolding monorepo |
| 5. Feature Blocks | ⏳ Pending | |
| 6. Integration Pass | ⏳ Pending | |
| 7. Test Coverage | ⏳ Pending | |
| 8. Polish & Harden | ⏳ Pending | |
| 9. Launch Prep | ⏳ Pending | |
| 10. Ship | ⏳ Pending | |
| 11. Listen & Iterate | ⏳ Pending | |

---

## Stage 1: Concept Lock ✅

**One-liner:** A real-time collaborative pixel canvas where X users compete for territory through hashtag-based factions.

**Target Users:** X (Twitter) users who enjoy collaborative art and competitive territory games.

---

## Stage 2: Scope Fence ✅

### V1 Core Features (Max 5)
1. 500x500 collaborative canvas with 16-color palette
2. X OAuth authentication with account age verification
3. Real-time pixel placement with cooldown system
4. Faction (hashtag) system with leaderboards
5. Mobile-responsive pan/zoom navigation

### "Not Yet" List
- Canvas expansion beyond 500x500
- Custom faction creation
- Timelapse generation
- Admin moderation tools
- API for external integrations
- Multiple canvas support

---

## Stage 3: Architecture Sketch ✅

### Stack
- **Frontend:** Next.js 14+ (App Router) → Vercel
- **WebSocket:** Node.js with `ws` → Railway
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash Redis (canvas state, cooldowns)
- **Auth:** X OAuth via Supabase

### Data Flow
```
User → Next.js (Vercel) → WebSocket (Railway) → Redis (Upstash)
                                    ↓
                              Supabase (PostgreSQL)
```

---

## Stage 4: Foundation Pour 🔄

### Checklist
- [x] GitHub repository created
- [x] Monorepo structure (pnpm + Turborepo)
- [ ] Next.js frontend scaffolded
- [ ] WebSocket server scaffolded
- [ ] Shared types package created
- [ ] Local dev environment (Docker)
- [ ] Vercel project connected
- [ ] Railway project connected
- [ ] Supabase project connected

### Checkpoint Question
> "Can we deploy an empty shell?"

**Status:** Not yet - completing scaffolding

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-17 | 500x500 canvas for MVP | Tighter space = more conflict = more engagement |
| 2024-12-17 | 16 colors (r/place palette) | Industry standard, forces creative dithering |
| 2024-12-17 | 5s/10s cooldowns (dev) | Fast iteration, will increase for production |
| 2024-12-17 | Redis bitfield for canvas | O(1) read/write, 125KB total storage |
| 2024-12-17 | Supabase for auth | Built-in X OAuth support |

---

## Overrides

None yet.
