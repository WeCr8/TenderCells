# v2 MCP tool model

Keep v0.3 tools during migration. Add a goal-oriented facade.

### Customer read
`get_farm_home`, `get_farm_overview`, `list_alerts`, `list_animals`, `get_animal`, `list_habitats`, `get_habitat`, `get_property_twin`, `list_devices`, `get_device`, `list_missions`, `get_mission`, `list_builder_projects`, `get_builder_project`, `get_builder_step`, `get_connection_status`.

### Local control
Preserve `emergency_stop`, `request_action`, `confirm_action` and the current confirm-twice/hub safety semantics.

### Admin
Admin tools must live behind a distinct authorization boundary. Suggested groups: customers, properties, devices, connector health, Builder content, missions, assets, integrations, simulation and firmware releases. Never register these on the customer `farm:read` connector.
