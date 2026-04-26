#!/usr/bin/env bash
# Check that build output chunks stay within size budgets.
# Exits non-zero if any chunk exceeds its limit.
#
# Usage: scripts/check-bundle-size.sh [dist-dir]

set -euo pipefail

DIST="${1:-dist/assets}"
FAILED=0

# check_chunk <name> <limit_bytes>
check_chunk() {
  local chunk="$1"
  local limit="$2"
  local file
  file=$(find "$DIST" -name "${chunk}-*.js" -not -name '*.map' 2>/dev/null | head -1)
  if [ -z "$file" ]; then
    echo "- ${chunk}: not found in $DIST (skipped)"
    return
  fi
  local size
  size=$(wc -c < "$file" | tr -d ' ')
  local limit_kb=$((limit / 1024))
  local size_kb=$((size / 1024))

  if [ "$size" -gt "$limit" ]; then
    echo "FAIL ${chunk}: ${size_kb} KB exceeds ${limit_kb} KB limit ($(basename "$file"))"
    FAILED=1
  else
    echo "OK   ${chunk}: ${size_kb} KB within ${limit_kb} KB limit"
  fi
}

# Budgets (bytes): 1 MB = 1048576, 500 KB = 512000, 400 KB = 409600, 200 KB = 204800
check_chunk phaser  1300000   # 1.27 MB — Phaser vendor
check_chunk battle   512000   # 500 KB  — battle logic
check_chunk index    512000   # 500 KB  — core app
check_chunk data     409600   # 400 KB  — pokemon/move data
check_chunk maps     204800   # 200 KB  — map data

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Bundle size budget exceeded! See above for details."
  exit 1
fi

echo ""
echo "All chunks within budget."
