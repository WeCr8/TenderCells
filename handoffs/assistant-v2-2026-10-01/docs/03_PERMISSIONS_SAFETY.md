# Permissions and safety

Hosted customer connector remains `farm:read` and read-only. Builder/Mission reads may be added. It must not actuate, E-STOP, administer other users, publish content or manage firmware.

Local connector retains request → preview/checklist → explicit human yes → confirm → hub safety recheck.

Admin should use explicit scopes such as `platform:read`, `builder:write`, `missions:write`, `assets:write`, `devices:admin`. Customer grants must never escalate.

Builder child/classroom privacy stays local/anonymous by default and existing safety gates remain authoritative.
