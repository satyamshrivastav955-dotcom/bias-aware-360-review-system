#!/usr/bin/env bash
# Swap the Gemini credential on one agent of Workflow A.
# Use when an agent starts returning 429 during a demo.
#
#   ./scripts/rotate-key.sh synthesis spare1
#   ./scripts/rotate-key.sh bias spare2
#   ./scripts/rotate-key.sh synthesis spare3
#
# Requires: n8n-cli logged in (n8n-cli config show), run from repo root.

set -euo pipefail

WORKFLOW_ID="LGGoOdiDTVdKrMon"
FILE="n8n-workflows/generate-review.json"

declare -A CREDS=(
  [synthesis]="nRdVnPhVIx57UnIe:Gemini Key Synthesis"
  [bias]="z7UvYnCSLpskwvEP:Gemini Key Bias"
  [spare1]="DqoIxMNpNgZOcli8:Gemini API Key"
  [spare2]="uQfQOtV9li43gOUV:Gemini Key Spare 2"
  [spare3]="TmYbw62pS8LJcBIH:Gemini Key Spare 3"
)

AGENT="${1:-}"
KEY="${2:-}"

if [[ "$AGENT" != "synthesis" && "$AGENT" != "bias" ]] || [[ -z "${CREDS[$KEY]:-}" ]]; then
  echo "usage: $0 <synthesis|bias> <${!CREDS[*]}>" >&2
  exit 1
fi

CRED_ID="${CREDS[$KEY]%%:*}"
CRED_NAME="${CREDS[$KEY]#*:}"

node -e "
const fs = require('fs');
const w = JSON.parse(fs.readFileSync('$FILE', 'utf8'));
const want = '$AGENT' === 'synthesis' ? 'Synthesis' : 'Bias';
const node = w.nodes.find(n => n.type === 'n8n-nodes-base.httpRequest' && n.name.includes(want));
if (!node) { console.error('agent node not found'); process.exit(1); }
node.credentials.httpHeaderAuth = { id: '$CRED_ID', name: '$CRED_NAME' };
fs.writeFileSync('$FILE', JSON.stringify(w, null, 2));
console.log('$AGENT -> $CRED_NAME');
"

n8n-cli workflow update "$WORKFLOW_ID" --file="$FILE" --json | grep -q '"active": true' \
  && echo "deployed, workflow active"
