#!/bin/bash
# WA Transparency - Run a specific job manually
# Usage: ./scripts/run-job.sh <job-name>
#
# Available jobs:
#   sync-pdc-contributions
#   sync-pdc-lobbying
#   sync-pdc-candidates
#   sync-usaspending
#   sync-wa-legislature
#   sync-wa-sos
#   compute-aggregates
#   trigger-rebuild
#   entity-resolution

set -e

JOB_NAME=$1

if [ -z "$JOB_NAME" ]; then
    echo "Usage: ./scripts/run-job.sh <job-name>"
    echo ""
    echo "Available jobs:"
    echo "  sync-pdc-contributions"
    echo "  sync-pdc-lobbying"
    echo "  sync-pdc-candidates"
    echo "  sync-usaspending"
    echo "  sync-wa-legislature"
    echo "  sync-wa-sos"
    echo "  compute-aggregates"
    echo "  trigger-rebuild"
    echo "  entity-resolution"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Running job: $JOB_NAME ==="
echo "Time: $(date)"

docker compose --profile jobs run --rm -e JOB_NAME=$JOB_NAME workers

echo "=== Job complete ==="
