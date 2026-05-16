# Open Issues

Running list of deferred decisions and items to revisit. Agents should add entries here when a decision is skipped, deferred, or needs follow-up. Do not remove entries — mark them resolved instead.

| Date | Issue | Status |
|---|---|---|
| 2026-05-13 | Pin `node:24-jammy` to a specific patch version in `Dockerfile` once confirmed via [hub.docker.com/_/node](https://hub.docker.com/_/node) | Open |
| 2026-05-13 | AI layer (Phase 5) — LLM provider (Azure OpenAI, OpenAI, Claude), RAG approach, chunking strategy, and caching TBD | Open |
| 2026-05-13 | Deployment target — needs cost/latency assessment once container image is ready | Open |
| 2026-05-13 | SPFx integration — CORS policy TBD | Resolved — `enableCors` scoped to `*-TENANT_NAME.sharepoint.com` via `TENANT_NAME` env var |
| 2026-05-14 | SPFx setup — confirm whether pre-authorizing `08e18876-6177-487e-b8b5-cf950c1e598c` (SharePoint Online Web Client Extensibility) in Entra **Expose an API → Authorized client applications** is sufficient alone, or whether `Grant-SpfxApiPermissions.ps1` is also required | Open |
| 2026-05-15 | `search.service.ts` uses hand-rolled `GraphSearchHit` / `GraphSearchResource` interfaces instead of the Microsoft-published `@microsoft/microsoft-graph-types` package. The package covers these shapes and is maintained by Microsoft, but `ListItem.fields` is typed as `FieldValueSet` (values in `additionalData`) rather than a plain object, which adds indirection for the `title` access we rely on. Revisit when adding more Graph entity types or if the hand-rolled interfaces drift from reality. | Open |
| 2026-05-15 | Live e2e tests (`npm run test:e2e:live`) require `az login --tenant <tenant-id>` before running — `get-dev-token.sh` calls `az account get-access-token` to acquire a delegated user token for the OBO flow. Developers must be logged in to the correct tenant via az cli. Automating this in CI/CD (GitHub Actions) is deferred — it requires an interactive user login step that doesn't map cleanly to a headless pipeline. | Open |
