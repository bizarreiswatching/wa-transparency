#!/bin/bash
# WA Transparency - Database Backup Script
# Run this script to backup the database to Google Cloud Storage

set -e

BACKUP_DIR="/opt/wa-transparency/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wa_transparency_${TIMESTAMP}.sql.gz"

# Load environment variables
if [ -f /opt/wa-transparency/.env ]; then
    export $(cat /opt/wa-transparency/.env | grep -v '^#' | xargs)
fi

echo "=== WA Transparency Database Backup ==="
echo "Timestamp: $TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "Creating database backup..."
docker exec wa-transparency-postgres pg_dump -U wa_user -d wa_transparency | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Check backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to Google Cloud Storage (if configured)
if [ -n "$GCS_BACKUP_BUCKET" ]; then
    echo "Uploading to GCS bucket: $GCS_BACKUP_BUCKET"
    gsutil cp "$BACKUP_DIR/$BACKUP_FILE" "gs://$GCS_BACKUP_BUCKET/backups/$BACKUP_FILE"

    # Verify upload
    if gsutil ls "gs://$GCS_BACKUP_BUCKET/backups/$BACKUP_FILE" > /dev/null 2>&1; then
        echo "Upload successful!"

        # Remove local backup after successful upload
        rm "$BACKUP_DIR/$BACKUP_FILE"
        echo "Local backup removed."
    else
        echo "WARNING: Upload verification failed. Keeping local backup."
    fi
else
    echo "GCS_BACKUP_BUCKET not configured. Keeping local backup only."
fi

# Clean up old local backups (keep last 7 days)
echo "Cleaning up old local backups..."
find $BACKUP_DIR -name "wa_transparency_*.sql.gz" -mtime +7 -delete

# Clean up old GCS backups (keep last 30 days) if configured
if [ -n "$GCS_BACKUP_BUCKET" ]; then
    echo "Cleaning up old GCS backups..."
    CUTOFF_DATE=$(date -d '30 days ago' +%Y%m%d)
    gsutil ls "gs://$GCS_BACKUP_BUCKET/backups/" | while read backup; do
        BACKUP_DATE=$(echo "$backup" | grep -oP '\d{8}' | head -1)
        if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
            echo "Removing old backup: $backup"
            gsutil rm "$backup"
        fi
    done
fi

echo ""
echo "=== Backup Complete ==="
echo "Backup file: $BACKUP_FILE"
