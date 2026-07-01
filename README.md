# BrutalAudit

BrutalAudit is the technical due diligence operating system for software projects. It provides deep static analysis and AI reasoning to surface security flaws, architectural debt, performance gaps, and AI slop that linters miss.

## Features
- **Security Scanning:** CVE detection, secret exposure, SQL injection vectors.
- **Architecture Analysis:** Circular dependencies, coupling metrics.
- **Performance Profiling:** Bundle bloat, N+1 queries.
- **AI Slop Detection:** Identifies generated code hallmarks.
- **Multi-Agent Evaluation:** AI persona evaluation (Security, DevOps, Architecture).

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Firebase Authentication
- **AI Engine:** Groq API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your keys
4. Run development server: `npm run dev`

## Deployment
This project is configured to deploy easily on Vercel.

## License
MIT
