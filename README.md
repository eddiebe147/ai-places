# X-Place

Real-time collaborative pixel canvas with X (Twitter) integration - an r/place clone with faction warfare.

## Overview

X-Place is a massive multiplayer canvas where X (Twitter) users compete for territory. Users authenticate via X OAuth, join hashtag-based factions, and place colored pixels on a shared 500x500 canvas.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router) on Vercel
- **WebSocket Server:** Node.js on Railway
- **Database:** Supabase (PostgreSQL + Auth)
- **Cache:** Upstash Redis (canvas state, cooldowns, leaderboards)
- **Auth:** X (Twitter) OAuth via Supabase

## Project Structure

```
x-place/
├── apps/
│   ├── web/           # Next.js frontend
│   └── ws-server/     # Node.js WebSocket server
├── packages/
│   └── shared/        # Shared types, constants, utilities
├── supabase/
│   └── migrations/    # Database migrations
└── docker/            # Local development
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Redis)
- Supabase account
- Upstash account

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/eddiebe147/x-place.git
   cd x-place
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start local services:
   ```bash
   pnpm docker:up  # Start Redis
   ```

5. Run development servers:
   ```bash
   pnpm dev        # Runs both web and ws-server
   ```

   Or run individually:
   ```bash
   pnpm dev:web    # Next.js on :3000
   pnpm dev:ws     # WebSocket on :8080
   ```

## Features

- **Real-time Canvas:** 500x500 pixel collaborative canvas
- **16-Color Palette:** Classic r/place color scheme
- **Faction System:** Compete with hashtag-based teams
- **Cooldown System:** 5s for verified users, 10s for others
- **Sybil Defense:** Account age verification (30+ days required)
- **Mobile Support:** Touch gestures for pan/zoom

## License

MIT
