# Self-hosted secure camera relay

This Apache-2.0 deployment keeps camera media, TURN credentials, and infrastructure accounts under the operator's control. It does not require a TenderCells cloud subscription or expose the ESP32 HTTP stream to the internet.

## Boundary

- The ESP32 MJPEG URL remains reachable only on the private LAN.
- FFmpeg converts that feed to H.264 and publishes it to the local MediaMTX service.
- coturn provides WebRTC NAT traversal. Its shared secret stays only in `.env` on this host.
- Put an authenticated HTTPS reverse proxy or VPN in front of any browser-facing MediaMTX endpoint. Do not publish port 8889 without access control.
- Open UDP/TCP 3478 and the configured UDP relay range only when remote TURN is required. Use 5349 only after installing a valid TLS certificate.

## Start

1. Install Docker Desktop on Windows/Mac or Docker Engine on Linux/Raspberry Pi 5.
2. Run `./generate-config.ps1` in PowerShell or `./generate-config.sh` on macOS/Linux.
3. Edit `.env`; set the private camera URL and public hostname.
4. Run `docker compose config` and inspect it for mistakes.
5. Run `docker compose up -d`.
6. Place MediaMTX behind an identity-aware HTTPS proxy or a private VPN such as WireGuard/Tailscale before remote viewing.

Docker Desktop users must enable host networking in Settings > Resources > Network. Linux supports host networking directly. A later production profile may replace host networking with an explicitly published, administrator-selected UDP relay range.

This bundle intentionally contains no TenderCells production keys, Firebase service account, Stripe credential, customer data, proprietary model, or managed-cloud configuration.
