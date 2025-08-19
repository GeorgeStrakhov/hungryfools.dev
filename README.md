# HungryFools.dev

<div align="center">
  <img src="public/video/pacduck_medium.gif" alt="PacDuck Logo" width="120">
  <h3><em>a directory of hungry and foolish vibecoders who ship human-level stuff at superhuman speed</em></h3>
  <p><strong>by vibecoders, for vibecoders</strong></p>
  
  [![GitHub](https://img.shields.io/badge/GitHub-GeorgeStrakhov%2Fhungryfools.dev-blue?logo=github)](https://github.com/GeorgeStrakhov/hungryfools.dev)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
</div>

## 🎯 About

HungryFools.dev is a directory where AI-first developers can show off their work, find people to collab with, and get hired.

**🚀 [Register at hungryfools.dev](https://hungryfools.dev)** or clone and run your own instance.

### Key Features

- 🔐 **GitHub OAuth Authentication** - Sign in with your GitHub account
- 👤 **Developer Profiles** - Show off your skills, interests, location, and if you're available
- 🚀 **Project Portfolios** - Show your best work with images and videos
- 🔍 **Smart Search** - AI-powered search that actually works
- 🏢 **Company Directory** - Companies can hire vibecoders
- 📱 **Responsive Design** - Built on Tailwind CSS and shadcn/ui
- 🌍 **GDPR Compliant** - EU-first data residency and privacy controls

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router, [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Auth.js v5](https://authjs.dev/) with GitHub OAuth
- **Database**: [Neon Postgres 17](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **File Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **AI Services**: [Groq](https://groq.com/) (LLM via kimi-k2-instruct), [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) (BGE-M3 embeddings)
- **Analytics**: [PostHog](https://posthog.com/) (EU region)
- **Email**: [Postmark](https://postmarkapp.com/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- A Neon Postgres database
- GitHub OAuth App
- Cloudflare account (for AI services and R2 storage)

### 1. Clone the Repository

```bash
git clone https://github.com/GeorgeStrakhov/hungryfools.dev.git
cd hungryfools.dev
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Copy `env.example` to `.env.local` and fill in the values:

```bash
cp env.example .env.local
```

Required environment variables:

```bash
# Auth.js (generate with: npx auth secret)
AUTH_SECRET=your-auth-secret

# GitHub OAuth (create at https://github.com/settings/developers)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Database (Neon Postgres)
DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# AI APIs
GROQ_API_KEY=your-groq-api-key
OPENROUTER_API_KEY=your-openrouter-key
REPLICATE_API_KEY=your-replicate-key

# Cloudflare (for BGE-M3 embeddings)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_KEY=your-api-key

# S3 Storage (Cloudflare R2 recommended)
S3_ENDPOINT_URL=your-r2-endpoint
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_ID_KEY=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=auto
S3_PUBLIC_ENDPOINT=https://cdn.yourdomain.com

# Email (Postmark)
POSTMARK_KEY=your-postmark-key
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Database Setup

#### Enable Required Extensions

Connect to your Neon database and enable the required extensions:

```sql
-- Enable pgvector for embeddings (required for search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_stat_statements for query monitoring (optional)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

#### Run Database Migrations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations to your database
pnpm db:migrate
```

### 5. Set Up External Services

#### GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App with:
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env.local`

#### Cloudflare Setup

1. **Create a Cloudflare account** and get your Account ID from the dashboard
2. **Create an API Token** with these permissions:
   - Zone: Zone Settings:Read, Zone:Read
   - Account: Cloudflare Workers:Edit, Account Settings:Read
3. **Create an R2 bucket** for file storage
4. **Generate R2 API tokens** for bucket access

#### Postmark (Email)

1. Create a [Postmark](https://postmarkapp.com/) account
2. Create a server and get the Server API Token
3. Verify your sender domain/email

#### PostHog (Analytics)

1. Create a [PostHog](https://posthog.com/) account (choose EU region)
2. Get your Project API Key from the settings

#### Groq (LLM)

1. Create a [Groq](https://groq.com/) account
2. Get your API key from the console
3. Add to `.env.local`: `GROQ_API_KEY=your-groq-api-key`
4. Used for structured LLM responses (query parsing, profile generation) with the kimi-k2-instruct model

### 6. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### 7. Testing the Search System (Optional)

To test the intelligent search functionality, you can generate mock profiles:

```bash
# Generate 30 diverse test profiles with AI-generated content
npx tsx scripts/generate-batch-test-profiles.ts 3

# Test the hybrid search system
npx tsx scripts/test-hybrid-search.ts

# Try specific test queries
npx tsx scripts/test-hybrid-search.ts all
```

The generated profiles include:
- **Diverse developers** from different companies (OpenAI, Anthropic, Mastra.ai, etc.)
- **Global locations** (Berlin, San Francisco, London, Remote, etc.)
- **Varied tech stacks** (Next.js, Python, AI/ML, TypeScript, etc.)
- **Realistic projects** with embeddings for semantic search
- **Personal interests** for complex query testing

**Example test queries that work:**
- `"AI developers in Berlin"`
- `"Next.js experts who like music"`
- `"Python developers building automation"`
- `"machine learning engineers interested in photography"`

**Cleanup when done:**
```bash
# Remove all test users and data
npx tsx scripts/cleanup-test-users.ts
```

## 📁 Project Structure

```
hungryfools/
├── public/                  # Static assets
│   └── images/             # Logos and images
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (app)/          # Main application routes
│   │   ├── admin/          # Admin dashboard
│   │   └── api/            # API endpoints
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── [feature]/      # Feature-specific components
│   ├── db/                 # Database configuration
│   │   └── schema/         # Drizzle ORM schemas
│   ├── lib/                # Utility functions and services
│   │   ├── actions/        # Server actions
│   │   ├── services/       # External service integrations
│   │   └── utils/          # Helper functions
│   └── types/              # TypeScript type definitions
├── drizzle/                # Database migrations
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format code with Prettier

# Database
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run database migrations

# Testing & Development
npx tsx scripts/generate-test-profiles.ts           # Generate 5 test profiles
npx tsx scripts/generate-batch-test-profiles.ts 3   # Generate 30 test profiles (3 batches)
npx tsx scripts/test-hybrid-search.ts               # Test search with sample queries
npx tsx scripts/test-hybrid-search.ts all           # Test all search queries
npx tsx scripts/cleanup-test-users.ts               # Remove all test users

# Code Quality
pnpm prettier         # Check code formatting
pnpm prettier:fix     # Fix code formatting
```

## 🔍 Key Features

### Authentication & Profiles

- GitHub OAuth integration with Auth.js v5
- Multi-step onboarding flow with LLM content normalization
- Rich developer profiles with skills, interests, and availability
- Public profile pages at `/u/{handle}`

### Project Showcase

- Full CRUD system for developer projects
- Media uploads (images/videos) via Cloudflare R2
- Individual project pages at `/u/{handle}/p/{slug}`
- Content moderation with LLM + profanity filtering

### Intelligent Search

- Hybrid search combining:
  - BM25 keyword matching (wink-nlp)
  - Vector similarity search (BGE-M3 embeddings)
  - BGE reranking for optimal results
- Natural language queries like "Next.js developers in Berlin who like music"

### Admin Dashboard

- User and content management
- System monitoring and analytics
- Service testing endpoints (LLM, S3, embeddings, email)
- Moderation tools

## 🌍 Privacy & Compliance

- **EU-first architecture** with data residency in Europe
- **GDPR compliant** with cookie consent and data controls
- **Content moderation** using AI + manual review
- **Secure authentication** with encrypted sessions

## 🚢 Deployment

### Environment Variables for Production

Update your production environment variables:

```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# ... other variables with production values
```

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set your environment variables in the Vercel dashboard
3. **Important**: Set the build command to `pnpm db:migrate && pnpm build` to run migrations on production
4. Deploy automatically on git push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love by the vibecoder community
- Powered by cutting-edge AI and modern web technologies
- Inspired by the hungry and foolish developers who ship fast

---

<div align="center">
  <strong>Happy Coding! 🦆</strong>
</div>
