// Tender Cells — LoRa Mesh implementation. See tc_mesh.h for the design notes.
#include "tc_mesh.h"

bool TcMesh::begin(int ss, int rst, int dio0) {
  // Derive a stable node address from the chip MAC if the caller didn't set one.
  if (_addr == 0) {
    uint64_t mac = ESP.getEfuseMac();
    _addr = (uint16_t)(mac & 0xFFFF);
    if (_addr == 0 || _addr == TC_MESH_BROADCAST) _addr = 1;  // avoid reserved values
  }

  LoRa.setPins(ss, rst, dio0);
  if (!LoRa.begin(TC_LORA_FREQ_HZ)) {
    _ready = false;
    return false;
  }

  // ── The shared PHY config. Every node MUST match these exactly. ──
  LoRa.setSignalBandwidth(TC_LORA_BW);
  LoRa.setSpreadingFactor(TC_LORA_SF);
  LoRa.setCodingRate4(TC_LORA_CR);
  LoRa.setPreambleLength(TC_LORA_PREAMBLE);
  LoRa.setSyncWord(TC_LORA_SYNCWORD);
  LoRa.enableCrc();                       // drop corrupt frames in hardware
  LoRa.setTxPower(TC_LORA_TXPOWER);
  LoRa.receive();                         // start listening

  _ready = true;
  return true;
}

bool TcMesh::alreadySeen(uint16_t src, uint16_t msgId) {
  for (uint8_t i = 0; i < TC_MESH_SEEN_CACHE; i++) {
    if (_seen[i].src == src && _seen[i].msgId == msgId) return true;
  }
  return false;
}

void TcMesh::remember(uint16_t src, uint16_t msgId) {
  _seen[_seenIdx].src = src;
  _seen[_seenIdx].msgId = msgId;
  _seenIdx = (_seenIdx + 1) % TC_MESH_SEEN_CACHE;
}

uint16_t TcMesh::txRaw(const TcMeshHeader& h, const uint8_t* payload) {
  if (!_ready) return 0;
  LoRa.beginPacket();
  LoRa.write((const uint8_t*)&h, sizeof(h));
  if (payload && h.len) LoRa.write(payload, h.len);
  LoRa.endPacket();          // blocking, but a 125k/SF9 frame is well under the watchdog
  LoRa.receive();            // return to RX after TX
  return h.msgId;
}

uint16_t TcMesh::sendTo(uint16_t dest, uint8_t type, const uint8_t* payload,
                        uint8_t len, uint8_t ttl) {
  if (!_ready) return 0;
  if (len > TC_MESH_MAX_PAYLOAD) len = TC_MESH_MAX_PAYLOAD;
  TcMeshHeader h;
  h.magic   = TC_MESH_MAGIC;
  h.version = TC_MESH_VERSION;
  h.src     = _addr;
  h.dest    = dest;
  h.msgId   = ++_txSeq;
  h.ttl     = ttl;
  h.type    = type;
  h.len     = len;
  // Remember our own packet so an echo from a relay doesn't loop back to us.
  remember(_addr, h.msgId);
  return txRaw(h, payload);
}

uint16_t TcMesh::sendBroadcast(uint8_t type, const uint8_t* payload, uint8_t len,
                               uint8_t ttl) {
  return sendTo(TC_MESH_BROADCAST, type, payload, len, ttl);
}

uint16_t TcMesh::sendBroadcast(uint8_t type, const char* json, uint8_t ttl) {
  return sendBroadcast(type, (const uint8_t*)json, (uint8_t)strlen(json), ttl);
}

void TcMesh::poll() {
  if (!_ready) return;
  int packetSize = LoRa.parsePacket();
  if (packetSize <= 0) return;

  // Read header.
  TcMeshHeader h;
  if (packetSize < (int)sizeof(h)) { while (LoRa.available()) LoRa.read(); return; }
  LoRa.readBytes((uint8_t*)&h, sizeof(h));

  // Validate framing.
  if (h.magic != TC_MESH_MAGIC || h.version != TC_MESH_VERSION) {
    while (LoRa.available()) LoRa.read();
    return;
  }
  if (h.len > TC_MESH_MAX_PAYLOAD) { while (LoRa.available()) LoRa.read(); return; }

  // Read payload.
  uint8_t buf[TC_MESH_MAX_PAYLOAD];
  uint8_t got = 0;
  while (LoRa.available() && got < h.len) buf[got++] = (uint8_t)LoRa.read();
  while (LoRa.available()) LoRa.read();   // discard any extra
  if (got != h.len) return;               // truncated

  // Ignore our own packets (relayed back to us) and exact duplicates.
  if (h.src == _addr) return;
  if (alreadySeen(h.src, h.msgId)) return;
  remember(h.src, h.msgId);
  _received++;

  int rssi = LoRa.packetRssi();

  // Deliver locally if addressed to us or broadcast.
  if ((h.dest == _addr || h.dest == TC_MESH_BROADCAST) && _cb) {
    _cb(h.src, h.type, buf, h.len, rssi);
  }

  // Relay: forward broadcasts and packets not meant for us, while TTL remains.
  // (We already recorded this (src,msgId), so we won't relay it again.)
  if (h.ttl > 1 && h.dest != _addr) {
    TcMeshHeader fwd = h;
    fwd.ttl = h.ttl - 1;
    txRaw(fwd, buf);
    _relayed++;
  }
}
