#!/usr/bin/env bash
# Prints a delegated bearer token for the sharepoint-search-assistant API.
# Requires: az cli logged in to the correct tenant (az login --tenant <tenant-id>)
# Reads AZURE_TENANT_ID and AZURE_CLIENT_ID from .env if present.
# Usage: ./scripts/get-dev-token.sh
#        ./scripts/get-dev-token.sh | pbcopy   # copy to clipboard (macOS)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ENV_FILE}"
  set +a
fi

: "${AZURE_TENANT_ID:?AZURE_TENANT_ID is not set. Add it to .env or export it.}"
: "${AZURE_CLIENT_ID:?AZURE_CLIENT_ID is not set. Add it to .env or export it.}"

az account get-access-token \
  --resource "api://${AZURE_CLIENT_ID}" \
  --tenant "${AZURE_TENANT_ID}" \
  --query accessToken \
  -o tsv
