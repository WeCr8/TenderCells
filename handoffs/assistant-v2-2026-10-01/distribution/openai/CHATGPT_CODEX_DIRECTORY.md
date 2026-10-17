# OpenAI: Publish TenderCells to the ChatGPT + Codex Plugin Directory

**Current as of 2026-10-01.**

OpenAI currently uses a **universal plugin directory shared by ChatGPT and Codex**.

## 1. Finish product readiness

Required TenderCells state:
- production MCP at `https://tendercells.com/mcp`;
- OAuth working;
- hosted tools read-only;
- B01 customer tools deployed;
- current Farm Card works;
- privacy/terms/support URLs live;
- dedicated reviewer account seeded.

## 2. Prepare publisher access

In the OpenAI platform:
- select the organization/project that will own the plugin;
- complete individual or business verification for the publisher name;
- ensure the submitting account is an organization owner or has the applicable Apps Management Write / `api.apps.write` permission.

TenderCells should publish under the verified **WeCr8 Solutions** identity if that is the business identity you want users to see.

## 3. Prepare the plugin ZIP

OpenAI's current preferred portable package format uses:
- root `plugin.json`;
- root `mcp.json`;
- optional `skills/`;
- optional `assets/`.

See `package-template/`.

For public MCP submission:
- use the production remote HTTPS MCP endpoint;
- do not embed secrets;
- do not put reviewer credentials in the ZIP;
- do not include `.app.json` app references or lifecycle hooks in the public submission ZIP at this time.

## 4. Upload the draft

In ChatGPT/OpenAI Plugins:
1. choose **Upload new or existing plugin**;
2. choose the verified Developer identity;
3. upload the plugin ZIP;
4. fix package validation errors before review.

## 5. Connect and scan the MCP server

In the draft's MCP section:
1. select the TenderCells MCP;
2. verify the server URL/authentication;
3. complete the domain-verification challenge shown by the portal;
4. authenticate;
5. scan tools;
6. inspect imported tool titles/descriptions/schemas/annotations/UI metadata.

Do not proceed if a hosted hardware-write tool appears. That is a release blocker.

## 6. Fill review materials

For an initial MCP-backed public review, current OpenAI documentation requires:
- **exactly 5 positive cases**;
- **exactly 3 negative cases**;
- a reviewer-accessible demo recording;
- reviewer credentials if authentication is required.

Use:
- `OPENAI_REVIEW_CASES.md`
- `REVIEWER_ACCOUNT.md`
- `DEMO_VIDEO_SHOTLIST.md`

Credentials belong in the secure dashboard review form, NOT the package.

## 7. Submit

Before clicking Submit:
- automated skill scans complete;
- MCP is connected;
- tool scan is current;
- review cases are complete;
- demo recording is accessible;
- legal/support URLs work.

Submit the selected draft for review.

## 8. Respond to findings

Treat any mismatch between:
- tool annotation and actual behavior;
- privacy policy and OAuth/data handling;
- listing claims and real capabilities;
- screenshots and current UI

as a must-fix issue.

## 9. Publish

Approval does not automatically mean “live.” Current OpenAI flow lets you choose when to **Publish** after approval.

Publish only after:
- production version/tag is known;
- support is ready;
- reviewer credentials remain valid until review is fully complete.

## 10. Updating later

Current OpenAI behavior:
- MCP server changes can be picked up without uploading a new plugin ZIP, subject to checks;
- plugin metadata/skills changes require a new ZIP/update flow.

After changing tools:
- rescan;
- rerun review-critical cases;
- update release notes.

## Official sources

- Plugin packaging: https://developers.openai.com/plugins/build/plugins
- Submission: https://developers.openai.com/plugins/deploy/submission
- MCP review requirements: https://developers.openai.com/plugins/deploy/app-review
- Plugin guidelines: https://developers.openai.com/plugins/plugin-guidelines
- Submission errors: https://developers.openai.com/plugins/deploy/submission-errors


## Packaged official brand assets

Use `brand/official/tendercells-icon-512.png` or `brand/official/tendercells-icon-1024.png` for store imagery. The exact vector source is in `brand/official/tendercells-icon.svg`.
