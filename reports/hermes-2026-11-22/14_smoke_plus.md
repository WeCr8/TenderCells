# Showcase smoke run - config plus

Commit: 091952c
Flags read by this commit: EBAY=True SERVICE_DOORS=True

| EBAY | SERVICE_DOORS | result | seconds | parts | routes (mm) |
|---|---|---|---:|---:|---|
| 0 | 0 | FAIL | 0.2 | - | ModuleNotFoundError: No module named 'build123d' |
| 0 | 1 | FAIL | 0.1 | - | ModuleNotFoundError: No module named 'build123d' |
| 1 | 0 | FAIL | 0.1 | - | ModuleNotFoundError: No module named 'build123d' |
| 1 | 1 | FAIL | 0.1 | - | ModuleNotFoundError: No module named 'build123d' |

SUMMARY: 0/4 PASS
