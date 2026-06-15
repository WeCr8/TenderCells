// Tender Cells — LoRa Mesh (tc_mesh)
//
// Shared mesh layer so every LoRa device (WatchTower, ChickenEye, coop relay)
// talks the SAME radio config and the SAME packet format, then meshes correctly:
// alerts hop node-to-node so a detection at the far fence still reaches the coop
// and the bridge even when no single radio can hear the broker directly.
//
// Why a shared lib: the #1 cause of "the mesh doesn't work" is mismatched PHY
// params — if two nodes disagree on frequency, bandwidth, spreading factor,
// coding rate, sync word, or preamble, they simply never hear each other. There
// is exactly ONE definition of those params here; every firmware includes it.
//
// What this gives you:
//   - One PHY config (915 MHz US ISM, BW 125k, SF9, CR4/5, private sync word).
//   - A 10-byte binary header with src/dest addressing, message id, and TTL.
//   - Receive + de-duplication (a node never acts on or relays the same packet
//     twice) + multi-hop relay (TTL decremented each hop) for range extension.
//   - A simple callback API: sendBroadcast()/sendTo() and onMessage().
//
// Honest scope: this is a lightweight flood mesh (managed broadcast with TTL +
// dedup), not a routed network. It is the right tool for sparse, low-rate alert
// traffic (predator events, heartbeats). It is NOT for high-throughput data.
//
// Radio: Semtech SX127x via sandeepmistry/LoRa. Polled in loop() (no ISR) to stay
// watchdog-friendly and avoid SPI-in-interrupt hazards.

#pragma once
#include <Arduino.h>
#include <LoRa.h>

// ── Shared PHY config — IDENTICAL on every node or they can't hear each other ──
#ifndef TC_LORA_FREQ_HZ
#define TC_LORA_FREQ_HZ   915E6   // US 902-928 ISM band (use 868E6 in EU builds)
#endif
#define TC_LORA_BW        125E3   // signal bandwidth
#define TC_LORA_SF        9       // spreading factor 6..12
#define TC_LORA_CR        5       // coding rate denominator → 4/5
#define TC_LORA_SYNCWORD  0x34    // private network sync word (NOT 0x12/0x34 LoRaWAN public)
#define TC_LORA_PREAMBLE  8       // preamble symbols
#define TC_LORA_TXPOWER   20      // dBm (PA_BOOST)

// ── Protocol ──────────────────────────────────────────────────────────────────
#define TC_MESH_MAGIC     0xAC    // packet sentinel ("AnimalCare")
#define TC_MESH_VERSION   1
#define TC_MESH_BROADCAST 0xFFFF  // dest address meaning "everyone"
#define TC_MESH_DEFAULT_TTL 3     // max hops; drop at 0 (covers a yard-sized mesh)
#define TC_MESH_MAX_PAYLOAD 200   // bytes of app payload after the header
#define TC_MESH_SEEN_CACHE  16    // recent (src,msgId) remembered for dedup

// Message types (extend as needed; keep < 256).
enum TcMeshType : uint8_t {
  TC_MSG_ALERT     = 1,   // predator/fault alert (payload = JSON)
  TC_MSG_HEARTBEAT = 2,   // node liveness
  TC_MSG_ESTOP     = 3,   // mesh-wide emergency stop fan-out
  TC_MSG_PING      = 4,   // link test
};

struct __attribute__((packed)) TcMeshHeader {
  uint8_t  magic;    // TC_MESH_MAGIC
  uint8_t  version;  // TC_MESH_VERSION
  uint16_t src;      // originating node address
  uint16_t dest;     // destination (TC_MESH_BROADCAST for all)
  uint16_t msgId;    // per-origin sequence number (for dedup)
  uint8_t  ttl;      // hops remaining
  uint8_t  type;     // TcMeshType
  uint8_t  len;      // payload length (<= TC_MESH_MAX_PAYLOAD)
};

// Delivered to the app for packets addressed to this node or broadcast.
typedef void (*TcMeshCallback)(uint16_t src, uint8_t type,
                               const uint8_t* payload, uint8_t len, int rssi);

class TcMesh {
 public:
  // Configure SPI pins + bring up the radio with the shared PHY config.
  // Returns false if the radio is absent (caller may continue degraded).
  bool begin(int ss, int rst, int dio0);

  // Node address. Default derives a stable 16-bit address from the chip MAC.
  void     setNodeAddr(uint16_t addr) { _addr = addr; }
  uint16_t nodeAddr() const { return _addr; }

  // Send. Returns the msgId used (0 if radio not ready).
  uint16_t sendBroadcast(uint8_t type, const uint8_t* payload, uint8_t len,
                         uint8_t ttl = TC_MESH_DEFAULT_TTL);
  uint16_t sendTo(uint16_t dest, uint8_t type, const uint8_t* payload, uint8_t len,
                  uint8_t ttl = TC_MESH_DEFAULT_TTL);
  uint16_t sendBroadcast(uint8_t type, const char* json, uint8_t ttl = TC_MESH_DEFAULT_TTL);

  // Must be called every loop(): drains RX, dedups, relays, fires onMessage.
  void poll();

  void onMessage(TcMeshCallback cb) { _cb = cb; }

  bool ready() const { return _ready; }
  uint32_t relayed() const { return _relayed; }   // diagnostics
  uint32_t received() const { return _received; }

 private:
  bool      _ready = false;
  uint16_t  _addr = 0;
  uint16_t  _txSeq = 0;
  TcMeshCallback _cb = nullptr;
  uint32_t  _relayed = 0;
  uint32_t  _received = 0;

  // Dedup ring buffer of recently seen (src,msgId).
  struct Seen { uint16_t src; uint16_t msgId; };
  Seen _seen[TC_MESH_SEEN_CACHE];
  uint8_t _seenIdx = 0;

  bool alreadySeen(uint16_t src, uint16_t msgId);
  void remember(uint16_t src, uint16_t msgId);
  uint16_t txRaw(const TcMeshHeader& h, const uint8_t* payload);
};
