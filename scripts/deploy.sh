#!/bin/bash
# WA Transparency - Deployment Script
# Run this to deploy updates to the VPS

set -e

DEPLOY_DIR="/opt/wa-transparency"

echo "=== WA Transparency Deployment ==="
echo "Time: $(date)"

cd $DEPLOY_DIR

# Create pre-deployment backup
echo "Creating pre-deployment backup..."
./scripts/backup.sh || echo "Backup skipped (database may not be running)"

# Pull latest changes
echo "Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Rebuild and restart services
echo "Rebuilding containers..."
docker compose build

echo "Restarting services..."
docker compose down
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker compose exec -T web pnpm db:migrate || echo "Migrations skipped or already up to date"

# Health check
echo "Running health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "Health check passed!"
else
    echo "WARNING: Health check returned $HEALTH_CHECK"
    echo "Check logs: docker compose logs web"
fi

# Trigger site revalidation
source .env 2>/dev/null || true
if [ -n "$REVALIDATE_SECRET" ]; then
    echo "Triggering site revalidation..."
    curl -X POST http://localhost:3000/api/revalidate \
        -H "Authorization: Bearer $REVALIDATE_SECRET" \
        -H "Content-Type: application/json" \
        -d '{"type": "all"}' || true
fi

echo ""
echo "=== Deployment Complete ==="
echo "Deployed at: $(date)"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Status: docker compose ps"
