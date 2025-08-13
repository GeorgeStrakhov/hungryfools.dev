# HungryFools.dev — Product Requirements Document (PRD)

## 🎯 Overview

HungryFools.dev is a directory of AI‑first "vibecoder" developers who build fast. The product enables:

- Developers to sign in with GitHub and publish rich profiles (skills/stack, interests, projects, availability).
- Other developers to discover and contact collaborators through intelligent search.
- Premium features for enhanced visibility (future monetization).

Primary users: AI‑first developers; Secondary users: hiring managers/companies.

## 👥 User Stories

### AI-First Developer (Primary User)
- **"I want to showcase my AI projects"**: Create a profile highlighting my AI/ML work, tools I've built, and technologies I use
- **"I want to find collaborators"**: Search for other developers working on similar problems (e.g., "developers building AI agents with TypeScript")
- **"I want to be discoverable"**: Get found by other developers or companies looking for my specific skills and interests
- **"I want to see what others are building"**: Browse profiles and projects to discover new tools, techniques, and potential collaborators

### Hiring Manager / Recruiter (Secondary User)
- **"I need to find specific talent"**: Search for developers with exact skill combinations (e.g., "Next.js developers in Berlin who have built AI applications")
- **"I want to see real work"**: View actual projects, code samples, and live demos rather than just resumes
- **"I need to understand the person"**: See not just skills but interests, working style, and what motivates them
- **"I want efficient outreach"**: Quickly identify and contact the right candidates through their preferred channels

### Community Member
- **"I want to stay current"**: Discover trending projects and see what the AI-first community is building
- **"I want to learn"**: Find people who've solved similar problems and learn from their approaches
- **"I want to contribute"**: Connect with open source projects that need contributors with my skills

## 🚀 Current State

### ✅ Completed Features

#### Core Platform
- **Authentication**: GitHub OAuth with Auth.js v5, Drizzle ORM, Neon Postgres
- **UI Foundation**: Tailwind + shadcn, responsive design, dark theme
- **Legal Compliance**: Privacy policy, terms of service, GDPR cookie consent

#### Developer Profiles
- **Profile System**: Complete CRUD for developer profiles (name, headline, bio, skills, interests, location, links, availability)
- **Onboarding Flow**: Multi-step guided setup with LLM content normalization
- **Public Pages**: SEO-friendly profile pages at `/u/{handle}`

#### Projects Showcase
- **Project Management**: Full CRUD system for developer projects
- **Rich Media**: S3/Cloudflare R2 integration for images and videos
- **Project Pages**: Individual project pages at `/u/{handle}/p/{slug}`
- **Content Moderation**: Batch validation using LLM + profanity filtering

#### Search & Discovery
- **Basic Search**: Keyword search across profiles and projects
- **Directory**: Paginated listing with search functionality
- **Enhanced Results**: Projects included in search results with preview cards

#### Admin & Analytics
- **Admin Dashboard**: User stats, profile metrics, system monitoring
- **User Management**: Admin role system with user promotion/demotion
- **Service Testing**: Admin pages for testing LLM, S3, embeddings, email
- **Analytics**: PostHog integration (EU) with event tracking infrastructure
- **Moderation Tools**: Batch content validation with leo-profanity filtering

### 🔧 Technical Infrastructure

- **Backend**: Next.js App Router, Server Actions, Drizzle ORM
- **Database**: Neon Postgres (EU region) with proper indexing
- **Storage**: Cloudflare R2 for media with image transformations
- **AI Services**: Cloudflare Workers AI (BGE-M3 embeddings, BGE reranker, LLM)
- **Analytics**: PostHog (EU data residency)
- **Moderation**: LLM-powered content validation + leo-profanity filtering

## 🎯 Current Priority: Intelligent Search

**Goal**: Implement intelligent hybrid search that handles natural language queries like "mastra.ai developers in Germany who also like music"

**No release until search is demonstrably superior to basic keyword matching.**

### Search Architecture
1. **LLM Query Intelligence**: Parse natural language to extract entities (companies, locations, skills, interests)
2. **Multi-Modal Search**: 
   - BM25 keyword matching (wink-nlp)
   - Vector similarity search (BGE-M3 embeddings via pgvector)
   - SQL filters for structured data
3. **BGE Reranking**: Final result ordering using existing reranker
4. **Performance Target**: <200ms response time

### Technical Implementation
- **Embeddings**: BGE-M3 (1024 dimensions) via Cloudflare Workers AI
- **Vector Storage**: pgvector extension on Neon with HNSW indexing
- **BM25**: wink-nlp library for fast keyword matching
- **Test Data**: Generate 200-500 realistic profiles using LLM for validation

## 📋 Future Development

### Next Priorities (Post-Search)
1. **Enhanced Filtering**: Location, skills/stack chips, availability toggles
2. **Search Analytics**: Complete PostHog instrumentation for search queries and CTR
3. **Performance Optimization**: Caching, query optimization, response time improvements

### Future Monetization (Later)
- **Premium Profiles**: Enhanced visibility, featured placement, analytics
- **Company Directory**: Paid company listings (much later priority)
- **Advanced Features**: Priority support, API access, team accounts

## 🎨 Design Principles

- **Developer-First**: Built by developers, for developers
- **Speed**: Fast loading, quick interactions, minimal friction
- **Intelligence**: Smart search that understands context and intent
- **Privacy**: GDPR compliant, EU data residency, user control
- **Quality**: Curated community with content moderation

## 📊 Success Metrics

### Core Metrics
- **Profile Quality**: >80% completion rate for onboarded users
- **Search Performance**: <200ms p95 response time
- **Search Quality**: >40% CTR on top 3 results
- **User Engagement**: >60% of directory visitors use search

### Growth Metrics
- **Monthly Active Users**: Track growth in returning users
- **Profile Completeness**: Monitor profile quality over time
- **Search Satisfaction**: User feedback on search relevance
- **Contact Conversion**: Clicks from profiles to external links

## 🔒 Privacy & Compliance

- **Data Residency**: EU-first (Neon EU, PostHog EU, Cloudflare EU)
- **GDPR Compliance**: Cookie consent, data export, deletion rights
- **Content Moderation**: Automated + manual review for quality
- **Security**: Secure authentication, encrypted data, audit logs

## 🛠️ Technical Architecture

```
Frontend (Next.js)
├── Authentication (Auth.js + GitHub OAuth)
├── UI (Tailwind + shadcn)
└── Analytics (PostHog)

Backend (Server Actions)
├── Database (Drizzle + Neon Postgres)
├── Search (BM25 + Vector + Reranking)
├── Media (Cloudflare R2)
├── AI Services (Cloudflare Workers AI)
└── Moderation (LLM + Profanity Filter)

Infrastructure
├── Hosting (Vercel)
├── Database (Neon Postgres EU)
├── Storage (Cloudflare R2)
├── AI (Cloudflare Workers AI)
└── Analytics (PostHog EU)
```

## 📈 Development Status

**Current Focus**: Intelligent search implementation
**Release Blocker**: Search quality must exceed keyword-only baseline
**Timeline**: Ship when ready (quality over speed)

---

*Last updated: August 13, 2025*