# PlatformIO pre-build script: auto-converts model/predator_model.tflite → src/model_data.cc
# Runs before every `pio run` if the tflite file is newer than the generated .cc file.
# Manual alternative: ./scripts/convert-tflite.sh
#
# Registered in platformio.ini via: extra_scripts = extra_scripts/convert_tflite.py

Import("env")  # type: ignore  # noqa: F821  PlatformIO injects this

import os

TFLITE_PATH = os.path.join(env.subst("$PROJECT_DIR"), "model", "predator_model.tflite")
OUTPUT_CC   = os.path.join(env.subst("$PROJECT_DIR"), "src", "model_data.cc")
OUTPUT_H    = os.path.join(env.subst("$PROJECT_DIR"), "src", "model_data.h")
ARRAY_NAME  = "g_predator_model_data"


def _is_stale():
    if not os.path.exists(OUTPUT_CC):
        return True
    return os.path.getmtime(TFLITE_PATH) > os.path.getmtime(OUTPUT_CC)


def convert_tflite(source, target, env):
    if not os.path.exists(TFLITE_PATH):
        print(
            f"[TFLite] {TFLITE_PATH} not found — "
            "using stub model_data.cc if present, else build will fail. "
            "Run ./scripts/convert-tflite.sh after placing your model."
        )
        return

    if not _is_stale():
        print("[TFLite] model_data.cc is up-to-date — skipping conversion")
        return

    print(f"[TFLite] Converting {TFLITE_PATH} → {OUTPUT_CC}")
    with open(TFLITE_PATH, "rb") as f:
        data = f.read()

    os.makedirs(os.path.dirname(OUTPUT_CC), exist_ok=True)

    # .cc file
    with open(OUTPUT_CC, "w") as out:
        out.write("// Auto-generated — DO NOT EDIT\n")
        out.write(f"// Source: model/predator_model.tflite  ({len(data)} bytes)\n")
        out.write("// Regenerate: ./scripts/convert-tflite.sh\n")
        out.write('#include "model_data.h"\n\n')
        out.write(f"alignas(8) const uint8_t {ARRAY_NAME}[] = {{\n  ")
        for i, byte in enumerate(data):
            out.write(f"0x{byte:02x}")
            if i < len(data) - 1:
                out.write(", ")
            if (i + 1) % 16 == 0:
                out.write("\n  ")
        out.write(f"\n}};\n\nconst int {ARRAY_NAME}_len = {len(data)};\n")

    # .h file
    guard = f"{ARRAY_NAME.upper()}_H_"
    with open(OUTPUT_H, "w") as out:
        out.write("// Auto-generated — DO NOT EDIT\n")
        out.write(f"#pragma once\n#ifndef {guard}\n#define {guard}\n")
        out.write("#include <stdint.h>\n\n")
        out.write(f"extern const uint8_t {ARRAY_NAME}[];\n")
        out.write(f"extern const int {ARRAY_NAME}_len;\n\n")
        out.write(f"#endif  // {guard}\n")

    print(f"[TFLite] ✓ {len(data)} bytes → {OUTPUT_CC}")


# Register as pre-action so it runs before any source file compilation
env.AddPreAction("$BUILD_DIR/src/main.cpp.o", convert_tflite)
