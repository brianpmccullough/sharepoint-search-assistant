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

- App registration: create Entra ID app registration; expose `user_impersonation` scope; set Application ID URI (`api://<client-id>`)
- SPFx trust: grant OAuth2 permission to the SharePoint Online Web Client Extensibility principal (`08e18876-6177-487e-b8b5-cf950c1e598c`) via `scripts/Grant-SpfxApiPermissions.ps1` so `aadTokenProviderFactory.getTokenProvider().getToken(...)` works from SPFx without per-user consent
- JWT Bearer Guard: validate incoming token against Azure AD JWKS; registered globally via `APP_GUARD` so all routes require auth by default
- `@NoAuthentication()` decorator: opts a route out of the global guard; applied only to `GET /health`
- OBO Service: exchange token for Graph API token via MSAL
- Unit tests for guard and OBO service (mocked MSAL)

**Deliverable:** authenticated requests pass through; unauthenticated requests return 401

#### Verification (completed 2026-05-14)

| # | Check | How | Result |
| --- | --- | --- | --- |
| 1 | Build compiles | `npm run build` | ✅ No errors |
| 2 | Unit tests — guard + OBO service | `npm test` | ✅ 6 tests pass |
| 3 | E2E — `GET /health` returns 200 without auth | `npm run test:e2e` | ✅ |
| 4 | E2E — `POST /search` returns 401 without bearer token | `npm run test:e2e` | ✅ |

---

### Phase 3 — CORS, Auth Hardening & SPFx Standup ✅

#### API

- CORS: `enableCors` scoped to `*-TENANT_NAME.sharepoint.com` via `TENANT_NAME` env var
- JWT strategy fix: corrected audience (`api://${clientId}`) and issuer (`https://sts.windows.net/${tenantId}/`) to accept v1.0 tokens — confirmed via live SPFx token; changing `accessTokenAcceptedVersion` in the manifest was ruled out to avoid unknown impact on SPFx token acquisition
- Dev tooling: `scripts/get-dev-token.sh` — retrieves delegated bearer token via `az cli` for local testing; `npm run test:e2e:live` wires token into e2e run automatically

#### SPFx ([repo](https://github.com/brianpmccullough/sharepoint-search-assistant-spfx))

- SPFx 1.22.2 Application Customizer scaffold with Heft build tooling
- Prettier + eslint-config-prettier for consistent formatting
- AGENTS.md documenting architecture, conventions, and hard constraints
- Basic call from SPFx to API confirmed (501 response with valid bearer token accepted by JWT guard)

**Deliverable:** authenticated requests from SPFx reach the API; CORS and JWT guard validated end-to-end

#### Verification

##### Automated — new e2e tests (`search.e2e-spec.ts`)

| # | Check | Result |
| --- | --- | --- |
| 1 | Preflight `OPTIONS /search` with `Origin: https://mmcbpm.sharepoint.com` returns CORS headers | ✅ |
| 2 | Preflight `OPTIONS /search` with a disallowed origin returns no CORS headers | ✅ |
| 3 | `POST /search` missing `query` field returns 400 | ✅ |
| 4 | `POST /search` with unknown field returns 400 | ✅ |
| 5 | `POST /search` with invalid bearer token returns 401 | ✅ |
| 6 | `POST /search` with real bearer token returns 501 (`npm run test:e2e:live`) | ✅ |

##### Manual *(requires `.env` with Azure credentials)*

| # | Check | How | Result |
| --- | --- | --- | --- |
| 7 | `./scripts/get-dev-token.sh` returns a valid JWT | Run script; decode at jwt.ms | ✅ |
| 8 | Real bearer token from `az cli` accepted by JWT guard (returns 501, not 401) | `npm run test:e2e:live` | ✅ |
| 9 | SPFx token accepted by JWT guard (returns 501, not 401) | Trigger call from SPFx customizer | ✅ |

---

### Phase 4 — Graph Search Integration ✅

- Search Service: `POST https://graph.microsoft.com/v1.0/search/query`
- Content scopes: `driveItem` (files/documents/PDFs) + `listItem` (pages/news) — note: `sitePage` is not a valid Graph Search entity type
- Request model: `query` (required), `from` (default: 0), `size` (default: 25)
- Response model: normalized `SearchResult[]` — title, url, summary, lastModified, contentType
- `summary` sourced from `hitHighlightedSummary`; empty string when absent
- Graph error mapping → NestJS HTTP exceptions
- Pagination passthrough (`from` / `size`) to Graph request body

**Deliverable:** `POST /search` returns ranked, normalized SharePoint results for an authenticated user

#### Verification

##### Unit tests — `search.service.spec.ts` (new, Graph client + MicrosoftAuthenticationService mocked)

| # | Check | Result |
|---|---|---|
| 1 | Normalizes a `driveItem` hit → `SearchResult` with `contentType: 'file'`, correct title/url/lastModified | ✅ |
| 2 | Normalizes a `listItem` hit → `SearchResult` with `contentType: 'page'` | ✅ |
| 3 | Populates `summary` from `hitHighlightedSummary` when present | ✅ |
| 4 | Defaults `summary` to empty string when `hitHighlightedSummary` is absent | ✅ |
| 5 | Passes `from` and `size` through to the Graph request body | ✅ |
| 6 | Uses defaults (`from: 0`, `size: 25`) when not provided in the request | ✅ |
| 7 | Throws `UnauthorizedException` (401) when Graph returns 401 | ✅ |
| 8 | Throws `ForbiddenException` (403) when Graph returns 403 | ✅ |
| 9 | Throws `InternalServerErrorException` for unexpected Graph errors | ✅ |

##### Unit tests — `search.controller.spec.ts` (new)

| # | Check | Result |
|---|---|---|
| 10 | Delegates to `SearchService.search()` with the request body | ✅ |
| 11 | Returns the `SearchResult[]` from `SearchService.search()` | ✅ |

##### E2E tests — `search.e2e-spec.ts` (additions/updates)

| # | Check | Result |
|---|---|---|
| 12 | `POST /search` with `from: -1` returns 400 | ✅ |
| 13 | `POST /search` with `size: 0` returns 400 | ✅ |
| 14 | `POST /search` with valid query returns 200 with at least one result with expected shape | ✅ (`test:e2e:live`) |
| 15 | `POST /search` with `size: 3` returns at most 3 results | ✅ (`test:e2e:live`) |

##### Manual *(requires `.env` with Azure credentials)*

| # | Check | How | Result |
|---|---|---|---|
| 16 | Response includes `driveItem` results for a document-matching query | Run `test:e2e:live`, inspect body | ✅ |
| 17 | Response includes `listItem` results for a page-matching query | Same | ✅ |
| 18 | `summary` field populated from `hitHighlightedSummary` | Inspect result items | ⚠️ Empty on this tenant — Graph does not always populate `hitHighlightedSummary`; not a bug |
| 19 | Pagination: `from: 0, size: 3` returns at most 3 results | `test:e2e:live` | ✅ |
| 20 | Live call confirmed end-to-end from SPFx Application Customizer | Trigger call from SPFx; inspect response | ✅ — `driveItem` and `listItem` results returned with correct shape |

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
