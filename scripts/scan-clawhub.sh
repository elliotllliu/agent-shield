#!/bin/bash
# Scan top ClawHub skills and output results as JSON
# Usage: bash scan-clawhub.sh

set -e

REPOS=(
  "vercel-labs/agent-skills"
  "remotion-dev/skills"
  "squirrelscan/skills"
  "obra/superpowers"
  "anthropics/skills"
  "coreyhaines31/marketingskills"
  "google-labs-code/stitch-skills"
  "hexiaochun/seedance2-api"
  "supercent-io/skills-template"
  "expo/skills"
)

WORKDIR="/tmp/clawhub-scan"
RESULTS="$WORKDIR/results.jsonl"
mkdir -p "$WORKDIR"
> "$RESULTS"

for repo in "${REPOS[@]}"; do
  echo ">>> Scanning $repo..." >&2
  dir="$WORKDIR/$(echo $repo | tr '/' '_')"
  
  if [ ! -d "$dir" ]; then
    git clone --depth 1 "https://github.com/$repo.git" "$dir" 2>/dev/null || {
      echo "  SKIP: clone failed" >&2
      continue
    }
  fi
  
  # Scan with JSON output
  node /tmp/agentshield/dist/cli.js scan "$dir" --json 2>/dev/null | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps({
  'repo': '$repo',
  'files': data['filesScanned'],
  'lines': data['linesScanned'],
  'score': data['score'],
  'critical': len([f for f in data['findings'] if f['severity'] == 'critical']),
  'warning': len([f for f in data['findings'] if f['severity'] == 'warning']),
  'info': len([f for f in data['findings'] if f['severity'] == 'info']),
  'findings': data['findings'][:20],
  'duration': data['duration']
}))
" >> "$RESULTS" 2>/dev/null || echo "  SKIP: scan failed" >&2
done

echo ">>> Done! Results in $RESULTS" >&2
