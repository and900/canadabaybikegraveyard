#!/usr/bin/env bash
# Cuts the tiles' bounds out of a pinned Protomaps daily build of OpenStreetMap, zooms 0-15 (about 9.7 MB), into
# public/tiles/canada-bay.pmtiles (git-ignored). Needs the pmtiles CLI: https://github.com/protomaps/go-pmtiles
set -euo pipefail
cd "$(dirname "$0")/.."

# Protomaps only keeps recent daily builds, so a pinned date soon vanishes. Use BUILD=<url> to pin one, otherwise take
# the newest build available in the last 45 days.
if [ -z "${BUILD:-}" ]; then
  for days_ago in $(seq 1 45); do
    candidate="https://build.protomaps.com/$(date -u -d "-$days_ago day" +%Y%m%d).pmtiles"
    if curl --silent --fail --head "$candidate" >/dev/null; then BUILD=$candidate; break; fi
  done
fi
: "${BUILD:?no recent Protomaps build found: see https://maps.protomaps.com/builds/}"
echo "Using $BUILD"
BBOX=$(node -p "require('@iwb/shared/data/council.json').tileBounds.join(',')")

if ! curl --silent --fail --head "$BUILD" >/dev/null; then
  echo "$BUILD is no longer available: bump the pinned build to a recent date listed at https://maps.protomaps.com/builds/" >&2
  exit 1
fi
mkdir -p public/tiles
pmtiles extract "$BUILD" public/tiles/canada-bay.pmtiles --bbox="$BBOX" --maxzoom=15 --quiet
