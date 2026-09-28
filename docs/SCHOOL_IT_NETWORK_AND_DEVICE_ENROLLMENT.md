# School IT Network and Device Enrollment

This runbook defines how a school can enroll TenderCells devices without disclosing production Wi-Fi credentials to students. It complements [DREAM Academy School Pilot](DREAM_ACADEMY_SCHOOL_PILOT.md) and [School SSO Plan](SCHOOL_SSO_PLAN.md).

## Required ownership

| Owner | Responsibilities |
|---|---|
| District IT | Approves SSID/VLAN, firewall rules, credentials, DNS/mDNS policy, device inventory, retention, and incident contacts |
| School administrator | Approves the pilot, data agreement, billing owner, and staff roles |
| Teacher or lab lead | Physically enrolls devices, stores recovery information, assigns devices, and supervises moving hardware |
| Student | Flashes approved firmware, claims assigned devices, views permitted telemetry, and runs teacher-approved tasks |

Students must never receive a shared staff, classroom, or production network password.

## Recommended network model

1. Create a dedicated 2.4 GHz IoT SSID and VLAN with client isolation appropriate for the pilot.
2. Prefer per-device PSKs/PPSKs or another revocable device-specific credential. A shared IoT PSK is acceptable only for a tightly scoped pilot and must be held by staff.
3. Permit outbound HTTPS on TCP 443, DNS, and time synchronization. Permit MQTT over TLS or secure WebSockets only to an approved broker.
4. Permit local camera access only from the approved teacher/lab network. Decide whether mDNS (`.local`) and client-to-device HTTP are allowed between those VLANs.
5. Block unsolicited inbound internet access to ESP32 devices. Do not port-forward camera streams.
6. Record the device ID, MAC address, assigned owner, location, firmware version, credential identifier, and retirement date in the school inventory.

Many school networks use WPA2-Enterprise/802.1X. The starter firmware must not be assumed compatible with those networks. Use an approved IoT PSK/PPSK SSID unless district IT has validated an enterprise-auth firmware profile.

## Teacher or IT enrollment

1. Register the device in the teacher-owned TenderCells workspace.
2. Connect the board to a staff-controlled Windows or macOS computer over USB.
3. Open the device Connection Wizard and scan for the approved 2.4 GHz network.
4. The authorized adult enters the credential. It is sent directly over Web Serial to the board and cleared from UI state after the attempt; it is not written to Firestore or product metadata.
5. Verify the board joins the approved network and record its MAC/IP assignment in the IT inventory.
6. For a camera, verify the local stream from the teacher network. Keep it marked `Local only` until an authenticated HTTPS/WebRTC relay is deployed.
7. Hand the enrolled device to the student. The student selects **Network Already Set by Teacher or IT**, verifies the device, and never handles the credential.

## Credential rotation and device removal

- Revoke or rotate the individual device credential when a board is lost, reassigned, or retired.
- Erase Wi-Fi credentials and firmware before disposal or transfer outside the district.
- Remove the device from TenderCells, school inventory, DHCP reservations, broker ACLs, and any camera relay.
- Keep device claim codes short-lived and single-use. A claim code is not a Wi-Fi credential.

## School intake checklist

- School and district legal names, billing owner, purchase-order process, tax status, and renewal contact.
- Technical owner, after-hours incident contact, approved domains, SSO provider, and roster source.
- IoT SSID/VLAN owner, 2.4 GHz availability, DHCP capacity, DNS/mDNS rules, firewall allowlist, proxy/TLS inspection policy, Web Serial policy, and managed-browser restrictions.
- Approved data classes, video/audio policy, retention period, export/deletion process, FERPA/COPPA review, and parent/guardian consent process.
- Device quantity, locations, adult supervisors, electrical/motion safety review, maintenance window, and decommissioning procedure.

Do not place passwords, private keys, Clever secrets, service-account files, student records, or named IT contacts in this repository.
