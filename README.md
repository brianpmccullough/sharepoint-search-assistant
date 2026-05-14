# SharePoint Search Assistant

A NestJS REST API that enables AI-assisted search over SharePoint Online content. An SPFx Application Customizer serves as the client, authenticating users via EntraID and forwarding requests to this API. The API uses the On-Behalf-Of (OBO) flow to query the Microsoft Graph Search API on each user's behalf.

## Prerequisites

- Node.js LTS
- An Azure EntraID app registration (see [Authentication](#authentication))
- A `.env` file (copy from `.env.example`)

## Getting Started

```bash
npm install
cp .env.example .env   # fill in Azure credentials
npm run start:dev
```

API is available at `http://localhost:3000`
Swagger UI is available at `http://localhost:3000/api`

## Authentication

This API uses the [On-Behalf-Of flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow). The client (SPFx) acquires a bearer token for this API's app registration via EntraID, and the API exchanges it for a Microsoft Graph token scoped to the user.

Required environment variables:

| Variable | Description |
|---|---|
| `AZURE_TENANT_ID` | EntraID tenant ID |
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_CLIENT_SECRET` | App registration client secret |

## Commands

```bash
npm run typecheck      # Type-check without emitting output
npm run lint           # ESLint (auto-fix)
npm run format         # Prettier (auto-fix)
npm test               # Unit tests
npm run test:e2e       # End-to-end tests
npm run build          # Compile for production
npm run start:prod     # Run production build
```

## Docker

```bash
docker build -t sharepoint-search-assistant .
docker run --rm -p 3000:3000 --env-file .env sharepoint-search-assistant
```

Or with Docker Compose:

```bash
docker compose up
```

## Project Structure

```
src/
  main.ts              # Bootstrap, Swagger, ValidationPipe
  app.module.ts        # Root module
  config/              # Typed env config (@nestjs/config)
  auth/                # JWT guard + OBO token exchange (Phase 2)
  search/              # Graph Search API integration (Phase 3)
  health/              # GET /health
```

## License

UNLICENSED
