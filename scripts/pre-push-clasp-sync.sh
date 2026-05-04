#!/usr/bin/env bash
set -euo pipefail

if [ "${SKIP_CLASP_SYNC:-}" = "1" ]; then
  echo "Skipping Apps Script sync because SKIP_CLASP_SYNC=1."
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

sync_paths=(
  "app_scripts"
  "package.json"
  "bun.lock"
  "scripts/clasp-deploy.mjs"
  ".clasp.json.example"
  ".clasp-deploy.json.example"
)

if ! git diff --quiet -- "${sync_paths[@]}" || ! git diff --cached --quiet -- "${sync_paths[@]}"; then
  cat >&2 <<'EOF'
Refusing to sync Apps Script before git push because sync-related files have uncommitted changes.

Commit or stash those changes first, then run git push again.
To bypass this hook for one push, run:
  SKIP_CLASP_SYNC=1 git push
EOF
  exit 1
fi

if [ ! -f ".clasp.json" ]; then
  cat >&2 <<'EOF'
Missing .clasp.json, so this repo is not connected to an Apps Script project.
Create it from .clasp.json.example before pushing.
EOF
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Missing bun. Install Bun before pushing, or run SKIP_CLASP_SYNC=1 git push." >&2
  exit 1
fi

echo "Syncing Apps Script HEAD with clasp before git push..."
bunx clasp push --force
echo "Apps Script sync complete."
