# OpenAI Package Build Notes

The portable template is intentionally minimal.

Before upload:
1. copy approved skills under `skills/<skill>/SKILL.md`;
2. copy approved store assets under `assets/`;
3. update the version;
4. verify `mcp.json` uses production HTTPS;
5. ZIP the *contents* of the plugin root so `plugin.json` is at ZIP root.

Recommended TenderCells skills after B03:
- farm-check
- builder-guide
- mission-guide
- device-connect

Do not include:
- reviewer credentials;
- private keys;
- `.env`;
- Firebase service credentials;
- `.app.json` for this public MCP submission;
- lifecycle hooks unless OpenAI's current public-submission rules change.

The public OpenAI package is separate from the existing Claude package. Keep both generated from the same source skills wherever practical.
