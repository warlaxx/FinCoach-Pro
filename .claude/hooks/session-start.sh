#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "==> Installing frontend dependencies..."
cd "$CLAUDE_PROJECT_DIR/frontend"
npm install

echo "==> Downloading backend Maven dependencies..."
cd "$CLAUDE_PROJECT_DIR/backend"
if ! mvn dependency:resolve -q --batch-mode; then
  echo "WARNING: Maven dependency resolution failed. Backend build may require internet access." >&2
fi

echo "==> Setup complete."
