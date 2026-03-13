#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# demo.sh - Build all packages and run the app with demo data
# =============================================================================
# Usage: ./demo.sh
#
# Prerequisites: docker, node, yarn
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
info "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || error "docker is not installed"
command -v node   >/dev/null 2>&1 || error "node is not installed"
command -v yarn   >/dev/null 2>&1 || error "yarn is not installed"

# ---------------------------------------------------------------------------
# 2. Set up environment variables
# ---------------------------------------------------------------------------
if [ ! -f .env ]; then
  info "Creating .env file with demo defaults..."
  cat > .env <<'EOF'
NODE_ENV=development
PORT=8080

# Database Config (local docker MySQL)
DATABASE_URL_SECURE=mysql://root:@localhost:3306/turborepo

# Redis (optional, leave empty for demo)
REDIS_URL=

# CMS Config (optional for demo)
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_PROJECT_ID=demo
SANITY_WEBHOOK_SIGNATURE=

# Linear Key (optional for demo)
NEXT_PUBLIC_LINEAR_KEY=
EOF
else
  info ".env file already exists, skipping creation"
fi

# ---------------------------------------------------------------------------
# 3. Start MySQL via Docker
# ---------------------------------------------------------------------------
info "Starting MySQL database via Docker..."
docker compose up -d

# Wait for MySQL to be ready
info "Waiting for MySQL to accept connections..."
MAX_RETRIES=30
RETRY=0
until docker exec turborepo_mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    error "MySQL did not start within ${MAX_RETRIES} seconds"
  fi
  sleep 1
done
info "MySQL is ready"

# ---------------------------------------------------------------------------
# 4. Install dependencies
# ---------------------------------------------------------------------------
info "Installing dependencies..."
yarn install

# ---------------------------------------------------------------------------
# 5. Generate Prisma client and push schema
# ---------------------------------------------------------------------------
info "Generating Prisma client..."
set -a; source .env; set +a
yarn workspace @shared/database generate

info "Pushing database schema..."
yarn workspace @shared/database db:push --accept-data-loss

# ---------------------------------------------------------------------------
# 6. Seed demo data
# ---------------------------------------------------------------------------
info "Seeding demo data..."
yarn tsx packages/database/src/seed-demo.ts

# ---------------------------------------------------------------------------
# 7. Build all packages
# ---------------------------------------------------------------------------
info "Building all packages..."
yarn build

# ---------------------------------------------------------------------------
# 8. Start the app in dev mode
# ---------------------------------------------------------------------------
info "============================================"
info " Demo environment is ready!"
info "============================================"
info " Web app:      http://localhost:3000"
info " API server:   http://localhost:8080"
info " Admin CMS:    http://localhost:4000"
info " Prisma Studio: run 'yarn studio' in another terminal"
info "============================================"
info "Starting dev servers..."
yarn dev
