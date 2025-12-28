# Meeting AI

A self-hosted meeting transcription and analysis platform. Upload audio recordings, get accurate transcriptions with speaker identification, and receive intelligent summaries with action items.

## Features

- **Audio Transcription** — Supports MP3, M4A, and WAV files up to 100MB
- **Speaker Diarization** — Automatically identifies and labels different speakers
- **Language Detection** — Supports 99 languages with automatic detection
- **AI Analysis** — Generates summaries, key points, topics, and action items
- **Custom Instructions** — Guide the AI analysis with specific prompts
- **Speaker Identification** — Automatically detects speaker names from conversation context

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | NextAuth v5 |
| Transcription | AssemblyAI |
| AI Analysis | Google Gemini |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- API keys for [AssemblyAI](https://www.assemblyai.com) and [Google AI Studio](https://aistudio.google.com)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meeting-ai.git
cd meeting-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Generate required secrets:
```bash
# Encryption key for API keys
openssl rand -hex 32

# Auth secret
openssl rand -base64 32
```

5. Update `.env.local` with your values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/meeting_ai"
ENCRYPTION_KEY="<your-generated-hex-key>"
AUTH_SECRET="<your-generated-base64-key>"
```

6. Start PostgreSQL (using Docker):
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=meeting_ai \
  -p 5432:5432 \
  postgres:16
```

7. Initialize the database:
```bash
npx prisma db push
```

8. Start the development server:
```bash
npm run dev
```

9. Open [http://localhost:3000](http://localhost:3000) and log in with the default credentials from your `.env.local`.

10. Navigate to **Settings** to configure your AssemblyAI and Gemini API keys.

## Usage

1. **Upload** — Drag and drop an audio file or click to browse
2. **Add Instructions** (optional) — Provide context or specific analysis requirements
3. **Process** — The system transcribes and analyzes automatically
4. **Review** — View the transcript with speaker labels, summary, topics, and action items

## Project Structure

```
meeting-ai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Login pages
│   │   ├── (dashboard)/     # Protected routes
│   │   └── api/             # API endpoints
│   ├── components/          # React components
│   └── lib/
│       ├── config/          # App configuration
│       ├── db/              # Prisma client
│       ├── services/        # Business logic
│       └── utils/           # Helpers
├── prisma/                  # Database schema
└── docker/                  # Docker configuration
```

## Docker Deployment

Build and run with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting API keys |
| `AUTH_SECRET` | NextAuth.js secret |
| `AUTH_EMAIL` | Default admin email |
| `AUTH_PASSWORD` | Default admin password |

API keys (AssemblyAI and Gemini) are configured through the Settings page and stored encrypted in the database.

## License

MIT
