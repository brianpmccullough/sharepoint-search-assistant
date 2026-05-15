# SharePoint Search Assistant

A NestJS REST API that enables AI-assisted search over SharePoint Online content. An SPFx Application Customizer serves as the client, authenticating users via EntraID and forwarding requests to this API. The API uses the On-Behalf-Of (OBO) flow to query the Microsoft Graph Search API on each user's behalf.

## Prerequisites

- Node.js LTS
- An Azure EntraID app registration (see [Environment Variables](#environment-variables))
- A `.env` file (see [Environment Variables](#environment-variables))

## Environment Variables

| Variable | Description |
| --- | --- |
| `AZURE_TENANT_ID` | EntraID tenant ID |
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_CLIENT_SECRET` | App registration client secret |
| `TENANT_NAME` | SharePoint tenant name (e.g. `mmcbpm` for `mmcbpm.sharepoint.com`) — used to scope CORS |

## Getting Started

```bash
npm install
npm run start:dev
```

API is available at `http://localhost:3000`
Swagger UI is available at `http://localhost:3000/api`

## Authentication

This API uses the [On-Behalf-Of flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow). The client (SPFx) acquires a bearer token for this API's app registration via EntraID, and the API exchanges it for a Microsoft Graph token scoped to the user.

## SPFx Setup

To allow an SPFx solution to acquire tokens for this API, complete the following steps in the [Entra admin center](https://entra.microsoft.com):

### 1. Expose an API

In your app registration → **Expose an API**:

- Set the Application ID URI (e.g. `api://<AZURE_CLIENT_ID>`)
- Add a scope named `user_impersonation`

### 2. Grant the OAuth2 permission via PowerShell

Run the provided script to create the OAuth2 permission grant so SPFx can acquire tokens tenant-wide without per-user consent prompts. Requires one of the following Entra ID roles ([source](https://learn.microsoft.com/en-us/graph/api/oauth2permissiongrant-post?view=graph-rest-1.0#permissions)): Application Administrator, Cloud Application Administrator, or Privileged Role Administrator.

```powershell
.\scripts\Grant-SpfxApiPermissions.ps1 -ResourceAppId "<AZURE_CLIENT_ID>"
```

The script will prompt to install the `Microsoft.Graph` modules if not already present, then authenticate interactively.

### 3. Acquire the token in SPFx

```typescript
const token = await this.context.aadTokenProviderFactory
  .getTokenProvider()
  .then(provider => provider.getToken('api://<AZURE_CLIENT_ID>'));
```

Pass this as `Authorization: Bearer <token>` when calling this API.

## Local Development Token

`scripts/get-dev-token.sh` fetches a delegated bearer token via the Azure CLI for testing the API locally. Requires `az login --tenant <AZURE_TENANT_ID>`. The Azure CLI app (`04b07795-8ddb-461a-bbee-02f9e1bf7b46`) must be added as an authorized client application under **Expose an API** in the app registration.

```bash
./scripts/get-dev-token.sh | pbcopy   # copy token to clipboard
npm run test:e2e:live                  # run e2e tests with a live token
```

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

```text
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
