# Expansion Profile Contract

Future community profiles should be data-driven.

Example:

```json
{
  "v": 1,
  "id": "my-rover",
  "label": "My Rover",
  "kinematics": "differential",
  "inputAxes": ["throttle", "steering"],
  "defaultRateHz": 20,
  "deadzone": 0.1,
  "expo": 0.2,
  "speedLimit": 0.6
}
```

## Extension rules

A profile may:
- name input axes
- select an existing kinematics adapter
- select limits and shaping defaults
- declare UI hints

A profile may not:
- bypass E-STOP
- disable stale-command stop
- execute arbitrary code from downloaded JSON
- claim unsupported device capabilities
- route motion through Firebase
