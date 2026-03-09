#!/usr/bin/env bash
# Convert area_councils_intensity.geojson to PMTiles for efficient web display.
# Requires: tippecanoe (https://github.com/felt/tippecanoe)
#   Install: brew install tippecanoe  (macOS) or apt install tippecanoe (Ubuntu)
#
# Usage: ./scripts/export_intensity_pmtiles.sh [input.geojson] [output.pmtiles]
# Default: output/area_councils_intensity.geojson -> output/area_councils_intensity.pmtiles

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT="${1:-$PROJECT_DIR/output/area_councils_intensity.geojson}"
OUTPUT="${2:-$PROJECT_DIR/output/area_councils_intensity.pmtiles}"

if [[ ! -f "$INPUT" ]]; then
  echo "Error: Input file not found: $INPUT"
  echo "Run Rscript scripts/export_intensity_geojson.R first."
  exit 1
fi

if ! command -v tippecanoe &>/dev/null; then
  echo "Error: tippecanoe not found. Install from https://github.com/felt/tippecanoe"
  echo "  macOS: brew install tippecanoe"
  echo "  Ubuntu: sudo apt install tippecanoe"
  exit 1
fi

# -zg = auto maxzoom from data density
# -l councils = layer name (use in MIS source_layer)
# --drop-densest-as-needed = simplify at low zooms
# --extend-zooms-if-still-dropping = keep simplifying
tippecanoe -o "$OUTPUT" -l councils -zg \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  "$INPUT"

echo "Exported PMTiles: $OUTPUT"
echo "Copy to MIS: vbos-backend/media/area_councils_intensity.pmtiles"
echo "Then create PMTilesDataset in Admin: url=media/area_councils_intensity.pmtiles, source_layer=councils"
