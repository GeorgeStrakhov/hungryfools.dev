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

- **Intelligent Profile Search**: Hybrid search (BM25 + vector + reranking) on `/directory` with natural language queries
- **Intelligent Project Search**: Dedicated project search on `/projects` with same hybrid search system
- **Enhanced Results**: Rich previews for both profiles and projects with search highlighting
- **Query Intelligence**: LLM-powered entity extraction for companies, locations, skills, interests

#### Admin & Analytics

- **Admin Dashboard**: User stats, profile metrics, system monitoring
- **User Management**: Admin role system with user promotion/demotion
- **Service Testing**: Admin pages for testing LLM, S3, embeddings, email
- **Analytics**: Comprehensive PostHog integration (EU) with centralized event tracking system
- **User Analytics**: Complete user identification, onboarding funnel tracking, profile/project view analytics
- **Moderation Tools**: Batch content validation with leo-profanity filtering

### 🔧 Technical Infrastructure

- **Backend**: Next.js App Router, Server Actions, Drizzle ORM
- **Database**: Neon Postgres (EU region) with proper indexing
- **Storage**: Cloudflare R2 for media with image transformations
- **AI Services**: Cloudflare Workers AI (BGE-M3 embeddings, BGE reranker, LLM)
- **Analytics**: PostHog (EU data residency)
- **Moderation**: LLM-powered content validation + leo-profanity filtering

## 🎯 Current Status: Intelligent Search System ✅ COMPLETED

**Goal**: ✅ **IMPLEMENTED** - Intelligent hybrid search for both profiles and projects that handles natural language queries

The hybrid search system is now live and operational across two main areas:

- **Profile Search** (`/directory`): "mastra.ai developers in Germany who also like music"
- **Project Search** (`/projects`): "AI automation tools built with Next.js"

### ✅ Implemented Search Architecture

1. **✅ LLM Query Intelligence**: Parses natural language to extract entities (companies, locations, skills, interests)
2. **✅ Multi-Modal Hybrid Search**:
   - BM25 keyword matching (wink-nlp) for both profiles and projects
   - Vector similarity search (BGE-M3 embeddings via pgvector) with dedicated profile and project embeddings
   - SQL filters for structured data (location, availability, featured status)
3. **✅ BGE Reranking**: Final result ordering using Cloudflare's BGE reranker for optimal relevance
4. **✅ Dual Search Interfaces**:
   - `/directory` for profile discovery
   - `/projects` for project discovery
5. **✅ Performance Optimization**: Parallel search execution with detailed timing analytics

### ✅ Implemented Technical Stack

- **✅ Embeddings**: BGE-M3 (1024 dimensions) via Cloudflare Workers AI for both profiles and projects
- **✅ Vector Storage**: pgvector extension on Neon with HNSW indexing
- **✅ Dedicated Embedding Tables**: Separate `profile_embeddings` and `project_embeddings` tables
- **✅ BM25**: wink-nlp library for fast keyword matching across all content types
- **✅ Test Data**: Scripts for generating realistic test profiles and projects
- **✅ Search Analytics**: Comprehensive timing and performance tracking for both search types

## 📋 Current Development Priorities

### Next Priorities

1. **Enhanced UI/UX**: Improve search interface with filters, facets, and result previews
2. **Additional Analytics**: Complete remaining analytics tracking (search analytics, navigation tracking, settings tracking, error tracking)
3. **Performance Optimization**: Caching, query optimization, and response time improvements
4. **Company Features**: Enhanced company directory and hiring tools

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

**✅ Major Milestones**:

- Intelligent search system completed and operational
- Centralized analytics system implemented with comprehensive tracking
  **Current Focus**: UI/UX improvements and remaining analytics features
  **Status**: Ready for launch - core functionality implemented

---

_Last updated: August 20, 2025_
