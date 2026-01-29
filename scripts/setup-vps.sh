#!/bin/bash
# WA Transparency - VPS Setup Script
# Run this on the haystack-001 VPS to add wa-transparency alongside existing haystack project

set -e

echo "=== WA Transparency VPS Setup ==="
echo "Adding to existing VPS with haystack project"

# Create app directory
echo "Creating application directory..."
sudo mkdir -p /opt/wa-transparency
sudo chown $USER:$USER /opt/wa-transparency
mkdir -p /opt/wa-transparency/backups
mkdir -p /opt/wa-transparency/logs

# Clone or update repo
if [ -d "/opt/wa-transparency/.git" ]; then
    echo "Updating existing repo..."
    cd /opt/wa-transparency
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/your-org/wa-transparency.git /opt/wa-transparency
fi

cd /opt/wa-transparency

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "IMPORTANT: Edit /opt/wa-transparency/.env with your actual values!"
fi

# Add wa.haystacklabs.io to existing Caddy config
echo "Updating Caddy configuration..."
CADDY_ADDITION='
# WA Transparency
wa.haystacklabs.io {
    reverse_proxy wa-transparency-web:3000
    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
'

# Check if wa.haystacklabs.io is already in Caddyfile
if ! grep -q "wa.haystacklabs.io" /opt/haystack/Caddyfile; then
    echo "Adding wa.haystacklabs.io to Caddyfile..."
    echo "$CADDY_ADDITION" | sudo tee -a /opt/haystack/Caddyfile
else
    echo "wa.haystacklabs.io already in Caddyfile"
fi

# Set up cron jobs for workers
echo "Setting up cron jobs..."
CRON_FILE="/tmp/wa-transparency-cron"

# Get existing crontab (if any)
crontab -l 2>/dev/null > $CRON_FILE || true

# Remove any existing wa-transparency entries
sed -i '/wa-transparency/d' $CRON_FILE

# Add wa-transparency jobs
cat >> $CRON_FILE <<'EOF'

# WA Transparency scheduled jobs
# Daily sync jobs (2 AM Pacific)
0 2 * * * cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=sync-pdc-contributions workers >> /opt/wa-transparency/logs/sync-pdc-contributions.log 2>&1
0 2 * * * cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=sync-pdc-lobbying workers >> /opt/wa-transparency/logs/sync-pdc-lobbying.log 2>&1
0 3 * * * cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=sync-pdc-candidates workers >> /opt/wa-transparency/logs/sync-pdc-candidates.log 2>&1

# Weekly jobs (Sunday)
0 4 * * 0 cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=sync-usaspending workers >> /opt/wa-transparency/logs/sync-usaspending.log 2>&1
0 5 * * 0 cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=sync-wa-legislature workers >> /opt/wa-transparency/logs/sync-wa-legislature.log 2>&1

# Daily post-sync jobs
0 6 * * * cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=compute-aggregates workers >> /opt/wa-transparency/logs/compute-aggregates.log 2>&1
0 7 * * * cd /opt/wa-transparency && docker compose --profile jobs run --rm -e JOB_NAME=trigger-rebuild workers >> /opt/wa-transparency/logs/trigger-rebuild.log 2>&1

# Database backup (3 AM)
0 3 * * * /opt/wa-transparency/scripts/backup.sh >> /opt/wa-transparency/logs/backup.log 2>&1
EOF

crontab $CRON_FILE
rm $CRON_FILE

echo "Cron jobs installed"

# Build and start services
echo "Building and starting wa-transparency..."
docker compose build
docker compose up -d

# Wait for postgres to be ready
echo "Waiting for database..."
sleep 10

# Reload Caddy to pick up new config
echo "Reloading Caddy..."
docker exec haystack-caddy caddy reload --config /etc/caddy/Caddyfile || \
    (cd /opt/haystack && docker compose restart caddy)

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/wa-transparency/.env with your actual credentials"
echo "2. Run database migrations: cd /opt/wa-transparency && docker compose exec web pnpm db:migrate"
echo "3. Configure Cloudflare DNS: CNAME wa -> 34.19.17.209 (or use A record)"
echo "4. Verify: curl http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f web     # View web logs"
echo "  docker compose logs -f postgres # View db logs"
echo "  ./scripts/run-job.sh entity-resolution  # Run a job manually"
