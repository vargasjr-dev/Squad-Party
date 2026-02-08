# Squad Party 🎉

**Mario Party for the mobile generation** — competitive mini-games for friend groups, anywhere.

No console required. No couch required. Just your phone and your squad.

[![Deploy with Vercel](https://vercel.com/button)](https://squad-party.vercel.app)

## ✨ Features

- **Instant Multiplayer** — Create a session, share the code, play together in seconds
- **AI Game Studio** — Create custom mini-games by describing them in plain English
- **Playlists** — Curate and share collections of your favorite games
- **Cross-Platform** — iOS, Android, and Web from a single codebase

## 🛠 Tech Stack

- **Mobile/Web**: React Native (Expo) + Next.js
- **Backend**: Express + WebSocket for real-time multiplayer
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Claude for Game Studio game generation
- **Game Engine**: Lua sandbox (Fengari) for user-created games

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Expo CLI (`npm install -g expo-cli`)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/vargasjr-dev/Squad-Party.git
cd Squad-Party

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Apply database migrations
npm run db:migrate

# Start development servers
npm run dev          # Web (Next.js)
npm run expo:dev     # Mobile (Expo)
npm run server:dev   # Backend API
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key for Game Studio |

## 🗃 Database

Squad Party uses PostgreSQL with Drizzle ORM and migration-based schema management.

### Migration Commands

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:push       # Direct push (development only)
npm run db:studio     # Open Drizzle Studio
```

### Workflow

1. Modify `shared/schema.ts`
2. Run `npm run db:generate` to create migration
3. Review the generated SQL in `migrations/`
4. Commit and push
5. Run `npm run db:migrate` on deploy

See [migrations/README.md](./migrations/README.md) for detailed documentation.

## 📁 Project Structure

```
Squad-Party/
├── app/              # Next.js pages (web)
├── client/           # React Native app
│   ├── components/   # Shared UI components
│   ├── contexts/     # React contexts (Auth, Game)
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities (Lua interpreter, API client)
│   ├── navigation/   # React Navigation setup
│   └── screens/      # Screen components
├── server/           # Express backend
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Data access layer
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
└── scripts/          # Build and utility scripts
```

## 🎮 How It Works

1. **Host** creates a session and selects a playlist
2. **Players** join via session code
3. **Games** run in sequence — each is 60 seconds of competitive chaos
4. **Results** show dramatic rankings after each round
5. **Winner** is crowned after all games complete

### Game Studio Magic

Users can create custom games by chatting with AI:

> "Make a trivia game about 90s movies"

The AI generates:
- Game metadata (name, rules, duration)
- Lua game logic that runs safely in-browser

No coding required. Just imagination.

## 📖 Vision

See [VISION.md](./VISION.md) for the full product vision and roadmap.

## 🤝 Contributing

Contributions welcome! Please read the codebase and VISION.md before submitting PRs.

## 📄 License

Private — All rights reserved.

---

*The party goes where you go.* 🎉
