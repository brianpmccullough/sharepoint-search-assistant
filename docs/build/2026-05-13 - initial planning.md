# SharePoint Search Assistant — Initial Planning

## Overview

A NestJS REST API that enables AI-assisted search over SharePoint Online content. An SPFx Application Customizer serves as the client, authenticating users via EntraID and calling this API with a bearer token. The API uses the On-Behalf-Of (OBO) flow to call the Microsoft Graph Search API on each user's behalf, returning ranked results from SharePoint.

An AI answer layer (RAG pattern) is planned but deferred until the search baseline is validated.

---

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js LTS |
| Framework | NestJS (latest) |
| Language | TypeScript (strict) |
| Auth | Azure EntraID — OBO flow via `@azure/msal-node` |
| Search | Microsoft Graph Search API (`POST /search/query`) |
| API docs | OpenAPI/Swagger via `@nestjs/swagger` |
| Config | `@nestjs/config` + `.env` |
| Deployment | Docker container (cloud-agnostic) |

---

## Architecture

```
SPFx Application Customizer (client)
  │  Authorization: Bearer <EntraID token>
  ▼
NestJS REST API
  ├─ JWT Bearer Guard      →  validates token via Azure AD JWKS
  ├─ OBO Service           →  exchanges token for Graph-scoped token (MSAL)
  └─ Search Service        →  POST /v1.0/search/query on user's behalf
       └─ Unified results: files (driveItem) + pages/news (sitePage)
```

### Auth flow (OBO)
1. SPFx acquires a token for the NestJS API's Azure AD app registration
2. Client sends `Authorization: Bearer <token>` to the API
3. JWT Guard validates the token against Azure AD's JWKS endpoint
4. OBO Service calls `ConfidentialClientApplication.acquireTokenOnBehalfOf()` to get a Graph-scoped token
5. Search Service calls Graph Search API with the user-delegated token

---

## Project Structure

```
src/
  main.ts                          # Bootstrap, Swagger setup
  app.module.ts
  config/
    config.module.ts               # Typed env config
  auth/
    auth.module.ts
    guards/
      jwt-bearer.guard.ts          # Validates incoming SPFx bearer token
    obo.service.ts                 # MSAL OBO token exchange
  search/
    search.module.ts
    search.controller.ts           # POST /search
    search.service.ts              # Graph Search API integration
    model/
      search-request.model.ts
      search-response.model.ts
  health/
    health.controller.ts           # GET /health
```

### Key dependencies
| Purpose | Package |
|---|---|
| Core | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` |
| Config | `@nestjs/config` |
| API docs | `@nestjs/swagger`, `swagger-ui-express` |
| Auth | `@azure/msal-node`, `passport`, `passport-jwt` |
| Graph API | `@microsoft/microsoft-graph-client` |
| Validation | `class-validator`, `class-transformer` |
| Containerization | Docker, Docker Compose (dev) |

---

## Build Phases

### Phase 1 — Scaffold & Infrastructure ✅
- `nest new` project with strict TypeScript config
- Docker + Docker Compose for local development
- `@nestjs/config` with a typed, validated env schema
- `@nestjs/swagger` wired up in `main.ts` (available at `/api`)
- `GET /health` endpoint via `@nestjs/terminus`
- Global `ValidationPipe` (whitelist + forbidNonWhitelisted)
- ESLint + Prettier baseline
- `.env.example`, `.gitignore`, multi-stage `Dockerfile`
- `AGENTS.md` — AI agent guidance for working in this codebase

**Deliverable:** runnable skeleton with Swagger UI and health check

**Verification (completed 2026-05-13)**

| # | Check | Command | Result |
|---|---|---|---|
| 1 | Build compiles | `npm run build` | ✅ No errors |
| 2 | Tests pass | `npm test` / `npm run test:e2e` | ✅ 1 e2e test passes (`GET /health`) |
| 3 | Health endpoint | `curl http://localhost:3000/health` | ✅ `{"status":"ok"}` |
| 4 | Swagger UI | `http://localhost:3000/api` in browser | ✅ UI loads with Bearer auth button |
| 5 | Validation pipe | `POST /health` with unknown field | ✅ 404 (no route); app stable |
| 6 | Docker build/run | `docker build` + `docker run` | ⏭ Skipped — Docker Desktop not installed; revisit in Phase 6 |

---

### Phase 2 — Authentication
- Design Azure AD app registrations (API app + SPFx client app)
- JWT Bearer Guard: validate incoming token against Azure AD JWKS
- OBO Service: exchange token for Graph API token via MSAL
- Unit tests for guard and OBO service (mocked MSAL)

**Deliverable:** authenticated requests pass through; unauthenticated requests return 401

---

### Phase 3 — Graph Search Integration
- Search Service: `POST https://graph.microsoft.com/v1.0/search/query`
- Content scopes: `driveItem` (files/documents/PDFs) + `sitePage` (pages/news)
- Request model: `query` (required), `from`, `size`, optional `contentSources`
- Response model: normalized `SearchResult[]` — title, url, summary, lastModified, contentType
- Graph error mapping → NestJS HTTP exceptions
- Integration tests with mocked Graph responses

**Deliverable:** `POST /search` returns ranked SharePoint results for an authenticated user

---

### Phase 4 — Result Enrichment
- Extract and expose hit highlights from Graph Search response
- Normalize `driveItem` and `sitePage` shapes into a unified `SearchResult` type
- Pagination support (`from` / `size` passthrough to Graph)

**Deliverable:** clean, paginated result contract ready for client consumption

---

### Phase 5 — AI Answer Layer *(TBD)*
- Deferred until the search baseline is validated in production
- Likely approach: RAG — retrieve top-N result chunks, pass to an LLM, return a synthesized natural-language answer alongside source links
- LLM provider, chunking strategy, and caching TBD

---

### Phase 6 — Hardening & Deployment
- Rate limiting (`@nestjs/throttler`)
- Structured logging (`nestjs-pino` or `winston`) with correlation IDs
- Multi-stage Dockerfile (build → production image)
- CI pipeline: GitHub Actions — lint → test → build image
- Deployment target decision: Azure Container App, Fly.io, Render, or similar low-cost container host

---

## Open Questions

- **AI layer**: LLM provider (Azure OpenAI, OpenAI, Claude) and RAG approach
- **Deployment target**: needs cost/latency assessment once container image is ready
- **Caching**: cache OBO tokens (MSAL does this by default); consider caching frequent search results
- **SPFx integration**: token audience configuration and CORS policy
