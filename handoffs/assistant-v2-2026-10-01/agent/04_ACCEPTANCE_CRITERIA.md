# Acceptance Criteria

## B01 functional

- `get_farm_home` returns:
  - generated time;
  - simulation flag;
  - system/device count;
  - attention summary;
  - concise device statuses.
- `list_devices` returns concise device list without requiring the model to parse XML.
- `list_missions` returns the six current mission records from Builder source.
- `get_mission` returns an existing mission by id.
- `list_builder_projects` returns all current project records.
- `get_builder_project` returns project metadata/parts/stages without fabricating data.
- `get_builder_step` returns one step and supports learner depth selection.

## B01 compatibility

- `get_farm_overview` unchanged and still uses Farm Card.
- `get_device`, `get_alerts`, `get_yard_events`, `get_farm_snapshot`, `get_hub_status` still work.
- local `emergency_stop` still exists.
- hosted mode still has no E-STOP or hardware action tools.
- local action mode still requires request → clear human yes → confirm.

## Builder integrity

- Mission/project content is generated from existing JSON.
- The generated artifact contains source path/id for traceability.
- The assistant never promotes `concept: true` book pages to verified wiring instructions.
- Technical asset readiness is preserved when exposed.

## Security

- No admin tool under `farm:read`.
- No cross-user queries introduced.
- No new Firestore write path.
- No action registration in hosted mode.

## Engineering

- TypeScript build green.
- Existing MCP tests green.
- New v2 tests green.
- Existing Builder tests green.
- No unrelated reformatting.
