# Security Policy

Tender Cells controls physical hardware around live animals — motors, doors, a
robot arm, heaters. We take security and safety reports seriously and appreciate
responsible disclosure.

## Supported Versions

The project is pre-1.0. Security fixes land on `main`. There is no long-term
support branch yet; always test against the latest `main`.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately, one of two ways:

1. **GitHub Security Advisories** (preferred) — open a draft advisory at
   `Security → Report a vulnerability` on the repository. This keeps the report
   private until a fix is ready.
2. **Email** — `security@wecr8.info` (or `hello@wecr8.info` if that bounces).
   Use the subject line `SECURITY: <short description>`.

Please include:

- What component is affected (app, firmware, cloud function, MQTT, hardware).
- Steps to reproduce, or a proof of concept.
- Impact — especially anything that could move hardware, bypass an E-STOP, or
  expose another owner's device or animal data.

We aim to acknowledge within **3 business days** and to agree on a disclosure
timeline with you. We will credit you in the advisory unless you prefer to remain
anonymous.

## Scope — what we care about most

Because this platform actuates real hardware, these classes are highest severity:

- **Hardware safety bypass** — anything that lets a command move the arm, open a
  door, or run a motor without the E-STOP / chicken-presence / confirmation
  safeguards. (See the safety rules in `.claude/CLAUDE.md` §5.)
- **Cross-tenant access** — reading or controlling a device, flock, or telemetry
  belonging to another owner (Firestore rules, MQTT topic isolation).
- **Secret exposure** — leaked API keys, WiFi/device credentials, or tokens in
  code, history, logs, or bundles.
- **Remote control plane** — unauthenticated MQTT publish to `tc/{deviceId}/cmd/*`
  or missing QoS/retain guarantees on the E-STOP topic.

## Out of scope

- Issues only reproducible in the public **sim-only demo** (no real hardware,
  data is local to the visitor's browser, nothing leaves their machine).
- Theoretical findings with no demonstrated impact.
- Reports about third-party dependencies without a working exploit against
  Tender Cells.

## Safe Harbor

Good-faith security research that follows this policy — no privacy violations, no
data destruction, no service disruption, and no testing against hardware you do
not own — will not be pursued or reported by us. If in doubt, ask first.
