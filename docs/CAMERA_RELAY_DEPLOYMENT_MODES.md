# Camera relay deployment modes

TenderCells supports the same encrypted WebRTC transport in two operational modes. Local operation remains free and open source; paid plans cover infrastructure operated by TenderCells.

| Boundary | Self-hosted | TenderCells Cloud |
|---|---|---|
| ESP32 camera stream | Private LAN only | Private LAN only |
| Gateway | Operator-owned computer | Operator gateway enrolled with TenderCells |
| TURN | Operator-owned coturn | TenderCells-managed coturn |
| Identity | Operator HTTPS proxy/VPN | Firebase owner and school-role authorization |
| Secrets | Generated and retained by operator | Google Secret Manager/runtime only |
| Media storage | Off by default | Off by default; explicit recording policy required |

## Secret rules

Never put Wi-Fi passwords, TURN shared secrets, Firebase service-account JSON, Stripe keys, private model weights, or production infrastructure configuration in firmware, browser bundles, device metadata, support exports, screenshots, or Git. A browser receives only five-minute TURN credentials. TenderCells signaling stores hashes of session bearer tokens and carries only WebRTC offers, answers, and ICE candidates; it does not carry video.

The managed deployment binds `TURN_SHARED_SECRET` from Google Secret Manager. `TURN_URLS` is non-secret routing configuration. The self-hosted bundle under `deploy/self-hosted-camera` generates its own unrelated secret and cannot access TenderCells production services.

## Production acceptance

Remote viewing is ready only after TURN connectivity succeeds from cellular and a second external network, expired and revoked sessions fail, device ownership is enforced, no private MJPEG URL appears in browser traffic outside the LAN, media is encrypted, concurrent-viewer limits are tested, and recording is disabled unless the owner explicitly enables it.
