#!/usr/bin/env bash
# Convert .tflite model to C array for embedding in ESP32 firmware.
# Run this before platformio build any time model/predator_model.tflite changes.
#
# Usage:
#   ./scripts/convert-tflite.sh
#   ./scripts/convert-tflite.sh firmware/watchtower/model/my_model.tflite src/model_data.cc g_my_model_data
#
# Requirements: xxd (Git Bash / Linux / macOS)
# PlatformIO auto-runs: firmware/watchtower/extra_scripts/convert_tflite.py

set -euo pipefail

MODEL_FILE="${1:-firmware/watchtower/model/predator_model.tflite}"
OUTPUT_FILE="${2:-firmware/watchtower/src/model_data.cc}"
ARRAY_NAME="${3:-g_predator_model_data}"
HEADER_FILE="${OUTPUT_FILE%.cc}.h"

# ── Validation ─────────────────────────────────────────────────────────────────
if [ ! -f "$MODEL_FILE" ]; then
  echo "ERROR: Model file not found: $MODEL_FILE"
  echo ""
  echo "Steps to get a .tflite model:"
  echo "  1. Train or download a MobileNetV2 / EfficientDet model"
  echo "  2. Convert with: python3 -c \\"
  echo "       \"import tensorflow as tf; "
  echo "        converter = tf.lite.TFLiteConverter.from_saved_model('saved_model/');"
  echo "        converter.optimizations = [tf.lite.Optimize.DEFAULT];"
  echo "        open('${MODEL_FILE}', 'wb').write(converter.convert())\""
  echo "  3. Re-run this script"
  exit 1
fi

if ! command -v xxd &>/dev/null; then
  echo "ERROR: xxd not found. Install via:"
  echo "  Ubuntu/Debian: sudo apt install xxd"
  echo "  macOS:         brew install xxd  (or use: vim -b)"
  echo "  Windows:       Available in Git Bash by default"
  exit 1
fi

MODEL_BYTES=$(wc -c < "$MODEL_FILE")
echo "Converting $MODEL_FILE → $OUTPUT_FILE"
echo "  Array: $ARRAY_NAME ($MODEL_BYTES bytes)"

mkdir -p "$(dirname "$OUTPUT_FILE")"

# ── Generate .cc ───────────────────────────────────────────────────────────────
{
  echo "// Auto-generated — DO NOT EDIT"
  echo "// Source: $MODEL_FILE"
  echo "// Regenerate: ./scripts/convert-tflite.sh"
  echo "// Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "#include <stdint.h>"
  echo "#include \"$(basename "$HEADER_FILE")\""
  echo ""
  echo "alignas(8) const uint8_t ${ARRAY_NAME}[] = {"
  # xxd -i produces hex array body; strip the variable declaration lines
  xxd -i < "$MODEL_FILE" | grep -v '^unsigned\|^}'
  echo "};"
  echo ""
  echo "const int ${ARRAY_NAME}_len = ${MODEL_BYTES};"
} > "$OUTPUT_FILE"

# ── Generate .h ────────────────────────────────────────────────────────────────
GUARD="${ARRAY_NAME^^}_H_"
{
  echo "// Auto-generated — DO NOT EDIT"
  echo "#pragma once"
  echo "#ifndef ${GUARD}"
  echo "#define ${GUARD}"
  echo "#include <stdint.h>"
  echo ""
  echo "extern const uint8_t ${ARRAY_NAME}[];"
  echo "extern const int ${ARRAY_NAME}_len;"
  echo ""
  echo "#endif  // ${GUARD}"
} > "$HEADER_FILE"

echo "✓ $OUTPUT_FILE ($MODEL_BYTES bytes)"
echo "✓ $HEADER_FILE"
