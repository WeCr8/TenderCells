# TenderCells v2 Master Completion Checklist

## A. Core assistant

- [ ] B01 customer facade implemented
- [ ] `get_farm_home`
- [ ] `list_devices`
- [ ] `list_missions`
- [ ] `get_mission`
- [ ] `list_builder_projects`
- [ ] `get_builder_project`
- [ ] `get_builder_step`
- [ ] Existing v0.3 tools preserved
- [ ] Hosted connector remains read-only
- [ ] Local confirm-twice unchanged
- [ ] Existing MCP tests green
- [ ] New v2 tests green

## B. Customer UX

- [ ] Farm Home feels customer-facing
- [ ] Animals naming used in public UI instead of Pets
- [ ] Mission card
- [ ] Builder project card
- [ ] Device card
- [ ] Alert detail card
- [ ] Property Twin assistant read path
- [ ] Simulation clearly labelled
- [ ] Accessibility tested

## C. Claude

- [ ] farm-check remains valid
- [ ] builder-guide added
- [ ] mission-guide added
- [ ] device-connect added
- [ ] plugin version updated
- [ ] `.mcp.json` points to production
- [ ] Claude custom connector tested
- [ ] Claude Code marketplace install tested
- [ ] `.mcpb` built
- [ ] `.mcpb` signed/released

## D. OpenAI

- [ ] portable plugin ZIP built
- [ ] official TenderCells logo included
- [ ] production MCP configured
- [ ] publisher identity verified
- [ ] domain verification completed
- [ ] tool scan reviewed
- [ ] 5 positive cases ready
- [ ] 3 negative cases ready
- [ ] demo recording ready
- [ ] reviewer credentials entered securely
- [ ] submission sent
- [ ] review findings resolved
- [ ] published

## E. Claude directory

- [ ] plugin bundle validated
- [ ] official logo/listing assets ready
- [ ] reviewer account works
- [ ] Claude scenarios pass
- [ ] submission sent
- [ ] findings resolved
- [ ] published

## F. OAuth / privacy / operations

- [ ] `farm:read` remains customer scope
- [ ] cross-user isolation test passes
- [ ] TTL on `oauthRequests.expireAt`
- [ ] TTL on `oauthGrants.expireAt`
- [ ] privacy policy current
- [ ] terms current
- [ ] assistant help page current
- [ ] self-service revoke works
- [ ] support inbox monitored
- [ ] no secrets in repository/package

## G. Builder content

- [x] M0 Explore the Farm
- [x] M1 Protect the Chickens
- [x] M2 Beat the Heat
- [x] M3 Robot Traffic Jam
- [x] M4 Build a Coop Brain
- [x] M5 Sensor Detective
- [x] M6 Make a Light Blink
- [x] M7 Starter Node / First Coop Brain
- [ ] M8 Replace Button with Sensor
- [ ] M9 Invent a TenderCell
- [ ] printable export
- [ ] teacher/classroom mode
- [ ] Python generator mirror

## H. Builder visual authority

- [ ] XIAO asset reference-checked
- [ ] USB-C assets reference-checked
- [ ] jumper wire family reference-checked
- [ ] JST assets reference-checked
- [ ] Dupont assets reference-checked
- [ ] WAGO/terminal assets reference-checked
- [ ] breadboard topology verified
- [ ] sensor assets verified
- [ ] power assets verified
- [ ] Chicken Tender Door BOM verified
- [ ] Chicken Tender Door wiring verified
- [ ] Chicken Tender Door mechanics verified
- [ ] concept flag removed only after all three pass

## I. Brand

- [x] authoritative TenderCells SVG included
- [x] square authoritative SVG included
- [x] 64/128/256/512/1024 raster sizes included
- [x] store-ready 512/1024 assets included
- [ ] real ChatGPT screenshot uses correct logo
- [ ] real Claude screenshot uses correct logo
- [ ] MCP serverInfo icon tested in both clients
- [ ] listing icon visually checked after platform masking

## J. Release QA

- [ ] `scripts/agent-preflight.sh`
- [ ] `scripts/verify-b01.sh`
- [ ] `scripts/store-preflight.sh`
- [ ] OS typecheck
- [ ] OS lint
- [ ] OS vitest
- [ ] OS build
- [ ] website typecheck/lint/docs/links/build
- [ ] hub typecheck/tests/describe check
- [ ] mobile Chrome QA
- [ ] mobile Safari QA
- [ ] desktop Chrome QA
- [ ] real OAuth connect/revoke test

## K. Future admin

- [ ] separate admin auth/resource
- [ ] admin read-only status
- [ ] content validation queue
- [ ] asset review queue
- [ ] device diagnostics
- [ ] content draft/update/publish
- [ ] audit records
- [ ] customer connector proves admin tools absent

## L. Smart Feeder engineering integration

- [x] source archive included intact
- [x] expanded engineering package included
- [x] file inventory/checksums generated
- [ ] current repo MQTT contract reconciliation
- [ ] MCU/pinout reconciliation
- [ ] procurement BOM → stable Builder part IDs
- [ ] canonical STEP authority mapped
- [ ] GLB reused through existing model-upload/Three.js path
- [ ] feeder digital twin integrated
- [ ] firmware safety review
- [ ] Builder Smart Feeder project authored
- [ ] calibration/test checkpoints authored
- [ ] applicable package validation results reviewed
- [ ] live hardware validation recorded

## M. DoorCell V1.4 engineering integration

- [x] source archive included intact
- [x] expanded engineering package included
- [x] file inventory/checksums generated
- [ ] current Chicken Tender Door book audited page-by-page
- [ ] DoorCell BOM mapped to stable Builder asset IDs
- [ ] controller/MCU/pinout reconciled
- [ ] MQTT contract reconciled
- [ ] rack/pinion/mechanical geometry review
- [ ] solar branch clearly optional
- [ ] open/closed limit tests passed
- [ ] timeout test passed
- [ ] overcurrent obstruction test passed
- [ ] close-obstruction safe response passed
- [ ] E-STOP test passed
- [ ] manual release test passed
- [ ] power-loss regression tests passed
- [ ] supervised bench cycles completed
- [ ] supervised mounted cycles completed
- [ ] animal-safe clearance inspection completed
- [ ] concept flag removed only after validation
