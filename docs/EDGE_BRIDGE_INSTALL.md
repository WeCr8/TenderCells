# Raspberry Pi and Jetson edge bridges

TenderCells uses a two-stage setup for Linux bridge computers:

1. Install the vendor-supported operating system with the vendor's imaging workflow.
2. Install and enroll the TenderCells bridge after the computer boots.

Do not treat a Raspberry Pi or NVIDIA Jetson like an ESP32. The browser flasher is for
microcontroller firmware only. It must not write arbitrary computer disks, collect an
administrator password, embed Wi-Fi credentials, or download and run an unverified root
script.

## Supported starting paths

| Computer | OS installation | Host computers | TenderCells use |
|---|---|---|---|
| Raspberry Pi 4 or 5 | Raspberry Pi OS 64-bit with Raspberry Pi Imager | Windows, macOS, Linux | MQTT bridge, local registry, camera gateway, light automation |
| Jetson Orin Nano Developer Kit | Official JetPack SD-card image | Windows, macOS, Linux | Barn Brain, GPU vision, camera gateway, MQTT bridge |
| Other Jetson Orin systems | NVIDIA SDK Manager or the board vendor's supported image | Depends on the exact module, carrier and JetPack release | Advanced Barn Brain deployment |

Use the exact board and carrier-board instructions. A Jetson image is not portable across
every Jetson model, storage target, or carrier board.

## Raspberry Pi

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Select the exact Pi model and Raspberry Pi OS 64-bit.
3. In OS customization, set a unique hostname and administrative user. Prefer SSH public-key
   authentication. A school adult or IT administrator enters network credentials; students
   should not receive a shared network password.
4. Let Imager complete its write verification before removing the card.
5. Boot the Pi, apply operating-system updates, and confirm its clock and hostname.

Raspberry Pi documents that Imager can preconfigure hostname, account, Wi-Fi and SSH. Imager
also supports SHA-256 verification and custom OS catalogs. TenderCells will not publish a
custom catalog until its images are reproducible, checksummed and release-signed.

## Jetson Orin Nano

1. Follow NVIDIA's [Jetson Orin Nano getting-started guide](https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit).
2. Check the board firmware prerequisite before writing a current JetPack 6.x image. Older
   factory firmware may need NVIDIA's documented update first.
3. Download the official Orin Nano Developer Kit SD-card image and write it using the method
   NVIDIA lists for Windows, macOS or Linux.
4. Complete the first-boot account and network setup locally.
5. Install or update the matching JetPack components using NVIDIA's documented package path:
   `sudo apt update && sudo apt install nvidia-jetpack`.

For production hardware, use the current [SDK Manager documentation](https://docs.nvidia.com/sdk-manager/)
and its compatibility matrix. Secure Boot and disk encryption are manufacturing/security
operations, not child-facing setup switches. Keys and irreversible fuse operations belong to
the device owner or school IT team.

## TenderCells installation boundary

The repository already contains the local MQTT/API runtime and an experimental camera relay
bridge. They are suitable for developer testing, but a public one-click bridge installer is
not yet released because enrollment must be device-scoped first.

A production bridge package must provide all of the following:

- A versioned Raspberry Pi `arm64` and Jetson `arm64` artifact from a tagged release.
- SHA-256 checksums plus release signatures verified before installation.
- A short-lived, single-use claim code generated while the owner is signed in.
- A unique device key generated on the bridge; no Firebase service-account file on a user device.
- MQTT over TLS with a per-device identity and topic ACLs such as `tc/<deviceId>/...`.
- Least-privilege services, no privileged container, read-only filesystems where practical,
  explicit camera/GPIO device access, and secrets outside images and source control.
- Automatic security updates with a rollback path and a visible installed version.
- Local-first operation. Cloud camera relay is opt-in, authenticated, encrypted and disabled
  until enrollment and entitlement checks pass.
- An extension directory or container profile for user software. Extensions declare required
  cameras, GPIO, serial ports, network access and MQTT topics; they do not receive every host
  permission by default.

Until that package and claim API are complete, use [Connect a Device](CONNECT_A_DEVICE.md) for
local MQTT development and [Camera Relay Bridge](CAMERA_RELAY_BRIDGE.md) only as an explicitly
experimental developer workflow. Do not install the current camera bridge on a school device
with a broad production Firebase service account.

## Preflight checker

After cloning a tagged TenderCells release onto the bridge, run:

```bash
node deploy/edge-bridge/check-readiness.mjs
```

For a future managed camera bridge, the same checker is deliberately stricter:

```bash
TC_EDGE_MANAGED=1 TC_EDGE_CAMERA=1 node deploy/edge-bridge/check-readiness.mjs
```

It blocks managed installation until a one-time claim code, an `mqtts://` broker and a
password-file-backed MQTT identity are supplied. It also blocks every mode when it detects a
Firebase Admin key on the bridge. The checker prints only presence/status information, never
secret values.

Custom workloads use `deploy/edge-bridge/extension.schema.json`. An extension image must be
pinned by SHA-256 digest and declare MQTT publish/subscribe topics, host devices, network scope
and GPU use. The eventual installer must validate this manifest and present the permissions to
an adult or administrator before starting the workload.

## Managed enrollment flow

1. Register the Pi or Jetson as a Bridge or Barn Brain in TenderCells.
2. While signed in as its owner or school administrator, request a bridge enrollment code.
   The backend stores only its SHA-256 digest and expires it after ten minutes.
3. On the bridge, use the code through the environment so it is not saved in shell history:

```bash
export TC_DEVICE_CLAIM_CODE='code-from-tendercells'
node deploy/edge-bridge/enroll.mjs \
  --device barn-brain-01 \
  --url https://us-central1-tender-cells.cloudfunctions.net/redeemEdgeEnrollmentCode
unset TC_DEVICE_CLAIM_CODE
```

The bridge generates its Ed25519 key locally. Redemption atomically consumes the code and
returns the MQTT password once. The utility requires HTTPS, requires an `mqtts://` broker,
writes the private key and password with owner-only permissions, and never prints a secret.
Firestore stores the MQTT password only as a salted scrypt hash in a backend-only collection.

Secure embedded MQTT mode uses `TC_MQTT_SECURE=1`, a TLS certificate/key and
`TC_MQTT_CREDENTIALS_FILE`. Every credential entry binds an exact MQTT client ID to explicit
publish and subscribe prefixes. Wildcard `+` topic grants are rejected. Local demo mode remains
available for an isolated development LAN, but it is not a managed or school deployment.

For camera specifically, prefer [`deploy/self-hosted-camera/`](../deploy/self-hosted-camera/README.md)
on this bridge computer instead: it needs no TenderCells cloud account or Firebase credential
of any kind (coturn + MediaMTX + ffmpeg, gated behind an HTTPS proxy or VPN you control). See
[Camera relay deployment modes](CAMERA_RELAY_DEPLOYMENT_MODES.md) for how that compares to the
TenderCells Cloud path above.

## Acceptance checklist

- The downloaded OS came from Raspberry Pi or NVIDIA and its write completed verification.
- The TenderCells artifact matches its published checksum and signature.
- No default password, Wi-Fi password, private key or cloud administrator credential is in the image.
- Enrollment codes expire quickly, work once and bind only the selected organization/device.
- A student account cannot install extensions, reveal network credentials or widen device permissions.
- Uninstall removes TenderCells services and credentials without damaging the vendor OS.
- Revoking the device prevents new cloud sessions while local E-STOP and manual controls remain usable.
- Pi and Jetson packages pass cold-boot, network-loss, update, rollback and power-loss tests.

## Primary references

- [Raspberry Pi getting started and Imager customization](https://www.raspberrypi.com/documentation/computers/getting-started.html)
- [Raspberry Pi Imager custom repository and checksum fields](https://github.com/raspberrypi/rpi-imager/blob/main/doc/os-sublist-example.json)
- [Raspberry Pi Imager CLI verification options](https://github.com/raspberrypi/rpi-imager/blob/main/doc/man/rpi-imager.1)
- [NVIDIA Jetson Orin Nano getting started](https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit)
- [NVIDIA JetPack setup for Orin Nano](https://docs.nvidia.com/jetson/orin-nano-devkit/user-guide/latest/setup_jetpack.html)
- [NVIDIA SDK Manager](https://docs.nvidia.com/sdk-manager/)
- [NVIDIA Jetson Secure Boot](https://docs.nvidia.com/jetson/archives/r36.4.4/DeveloperGuide/SD/Security/SecureBoot.html)
- [NVIDIA Jetson disk encryption](https://docs.nvidia.com/jetson/archives/r36.2/DeveloperGuide/SD/Security/DiskEncryption.html)
