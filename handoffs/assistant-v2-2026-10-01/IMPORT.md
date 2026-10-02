# Import provenance

Imported 2026-10-01 from the user-provided `TenderCells_AI_Assistant_Plugin_v2_Complete_Handoff_With_Feeder_DoorCell.zip` onto main baseline `53c9347` (PR #174).

Source ZIP SHA-256: `ba5a0d05e124789bfe1a86cea5d15c3b3dd735e78ddf2b7a5f5914a170a21540`.

All 467 source files are preserved byte-for-byte. The only additions inside this directory are this note and `.gitattributes`, which prevents line-ending conversions from breaking the supplied inventories.

Validation: outer ZIP CRC, all 466 non-manifest entries in `manifest.json` match their byte lengths and SHA-256 values, both embedded hardware ZIPs match `hardware/inventories/source-archives.json` and pass CRC checks, and all supplied JSON parses successfully. The supplied manifest includes its own path with a stale length/hash; that source inconsistency is retained and explicitly excluded from payload checksum validation.

This commit imports the complete handoff, not the B01-B09 implementation. The existing connector, Builder, firmware and website remain the runtime source of truth. Consult `agent/00_START_HERE.md` and `hardware/README.md` before promoting scaffold code or prototype engineering inputs. Claims in the source package are supplied planning statements, not additional verification by this import.
