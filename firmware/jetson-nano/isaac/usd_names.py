"""Prim naming shared with the OS exporter (src/lib/yard/usdExport.ts primName)."""

import re


def prim_name(item_id: str) -> str:
    """Valid USD prim name from a layout item id - must match primName() in usdExport.ts."""
    s = re.sub(r"[^A-Za-z0-9_]", "_", item_id)
    return s if re.match(r"[A-Za-z_]", s) else f"_{s}"
