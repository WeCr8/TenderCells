/**
 * Tender Cells — Starter Node
 *
 * The smallest real Tender Cells device. Runs on a cheap Seeed XIAO ESP32-S3
 * (or any ESP32-S3 dev board) with NO coop hardware attached. Its whole job is
 * to prove the pipeline end to end:
 *
 *     WiFi captive-portal provisioning  →  MQTT heartbeat  →  E-STOP handling
 *
 * Flash it, set WiFi + broker IP, and the board shows up in `tc status` and the
 * dashboard just like a real coop — blinking its LED to say "I'm alive." It's
 * the on-ramp board for learners before they build a full Chicken Tender.
 *
 * Safety/convention parity with the rest of the firmware tree:
 *   - No hardcoded WiFi creds or device IDs (captive portal + NVS).
 *   - E-STOP handled first, every loop, QoS 2 retained topic.
 *   - Watchdog enabled; non-blocking reconnect; no delay() > 50ms in loop().
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_task_wdt.h>
#include <ESP32Servo.h>   // door servo + continuous-rotation drive servos
#include <DHT.h>          // DHT22 temp/humidity (peripheral=temp-humidity)
#include <LoRa.h>         // optional mesh radio (meshOnly, or as a WiFi<->mesh bridge)
#include "tc_mesh.h"      // shared Tender Cells LoRa mesh (firmware/shared/tc_mesh)

// ── Board ──────────────────────────────────────────────────────────────────
// XIAO ESP32-S3 user LED is on GPIO21 and is active-LOW.
static const int LED_PIN = 21;
static const bool LED_ACTIVE_LOW = true;
// BOOT button (GPIO0, active-LOW) doubles as the "trigger a threat" button so a
// learner can make an alert fire with no extra wiring. Press = publish a threat.
static const int BTN_PIN = 0;

// ── Actuator pins (classroom wiring) ─────────────────────────────────────────
// One Starter Node binary, two teachable actuators, selected by `peripheral`:
//   peripheral=door  → a single hobby servo swings a 3D-printed coop door.
//   peripheral=drive → two CONTINUOUS-rotation servos = the basic Roaming Roost
//                      (differential drive). Cheapest classroom rover: no H-bridge,
//                      low current, USB-safe. The real product uses DC motors + L298N
//                      (see firmware/roaming-roost) — same MQTT contract, bigger parts.
// Wire signal to these GPIOs, servo V+ to 5V, GND common. Pins chosen to avoid the
// strapping/USB pins on the XIAO ESP32-S3.
static const int PIN_DOOR_SERVO  = 2;   // D1 — door (peripheral=door)
static const int PIN_DRIVE_LEFT  = 3;   // D2 — left drive servo  (peripheral=drive)
static const int PIN_DRIVE_RIGHT = 4;   // D3 — right drive servo (peripheral=drive)
// peripheral=relay → a relay module drives any farm load: heat lamp, water pump,
// grow light, ventilation fan. Active-HIGH; wire relay IN to this pin.
static const int PIN_RELAY       = 5;   // D4 — relay (peripheral=relay)
// peripheral=gantry → bridge MQTT moves to a GRBL controller over UART as G-code.
// Works with any GRBL: Arduino Uno + CNC shield, grbl_ESP32, or FluidNC. Wire this
// board's TX→GRBL RX, RX←GRBL TX, common GND.
static const int PIN_GRBL_TX = 43;      // D6 → GRBL RX
static const int PIN_GRBL_RX = 44;      // D7 ← GRBL TX
#define GRBL Serial1
// Real sensors: DHT22 data pin (peripheral=temp-humidity), LDR on an ADC pin
// (peripheral=light). Wire DHT data→GPIO6; LDR divider mid→GPIO1.
static const int PIN_DHT = 6;
static const int PIN_LDR = 1;
// peripheral is orthogonal to mesh - meshOnly (setup portal field, not a
// peripheral value) can pair with ANY of the above. LoRa SX127x on the XIAO
// ESP32-S3's last free header pins (D8/D9/D10 - nothing else above uses them).
static const int PIN_LORA_SS   = 7;   // D8
static const int PIN_LORA_RST  = 8;   // D9
static const int PIN_LORA_DIO0 = 9;   // D10

static const int DOOR_OPEN_DEG  = 90;   // matches Chicken Tender coop door
static const int DOOR_CLOSE_DEG = 0;
// Continuous-rotation servo: 90µs-center = STOP; offset = speed/direction.
static const int DRIVE_STOP_DEG = 90;
static const int DRIVE_SPAN_DEG = 70;   // max offset from stop (90±70 → 20..160)

// ── Timing ─────────────────────────────────────────────────────────────────
static const unsigned long HEARTBEAT_INTERVAL_MS = 10000;  // matches sensor cadence
static const unsigned long MQTT_RECONNECT_MS      = 5000;
static const unsigned long WATCHDOG_TIMEOUT_S     = 8;
// Drive deadman: a moving robot must stop itself if commands stop arriving (lost
// WiFi, closed app). If no fresh cmd/drive within this window, motors stop.
static const unsigned long DRIVE_DEADMAN_MS       = 1500;

// ── Provisioned config (stored in NVS, never hardcoded) ──────────────────────
Preferences prefs;
String brokerIp;
String brokerPort;
String deviceId;
// One Starter Node binary can stand in for ANY product type. The user picks which
// product this node represents in the setup portal; it's reported in the heartbeat
// so the dashboard groups/labels it correctly. Valid values match the app's
// productType union (chicken-tender, roaming-roost, duck-dock, bunny-burrow,
// goat-guardian, turkey-tower, pigeon-palace, watchtower) or "starter" for a bare node.
// Use "custom" for an invented device (a school/maker project) — pair it with a
// free-text species + threat label below so kids can model any animal + any threat.
String productType;
// Free-text species this node watches (e.g. "axolotl", "honeybee", "chicken"). Blank ok.
String species;
// Label used when the threat button fires (e.g. "predator", "hawk", "overheat").
String threatLabel;
// What this node physically carries, so the dashboard knows what it is rather than
// guessing. Values: none, camera, temp-humidity, ammonia, door, load-cell, or any
// free-text label for a custom build. Starter Node ships no real sensor, so this is
// a declaration of intent (demo) or the actual attached part (live).
String peripheral;
// If "yes": this board never joins WiFi/MQTT at all - it only speaks the LoRa
// mesh, so a student never needs (or is given) a real network password. Needs
// at least one other board on the same mesh with WiFi configured to act as a
// bridge (any board with a radio attached does this automatically - see
// meshAttached below - no separate "bridge firmware" exists).
String meshOnlyPref;

// ── Runtime ──────────────────────────────────────────────────────────────────
WiFiClient net;
PubSubClient mqtt(net);

// ── LoRa mesh (optional - degrades to "no mesh" if no radio answers begin()) ──
TcMesh mesh;
bool meshOnly = false;      // this board: mesh only, never touches WiFi/MQTT
bool meshAttached = false;  // a LoRa radio answered - this board can send/relay

// Peers heard directly from their own mesh heartbeats (id <-> address), so a
// WiFi-connected board can bridge a mesh-only board's telemetry to MQTT and
// its MQTT commands back over the mesh, with no config on either side beyond
// "both boards have a radio and picked the same product/device naming."
// Ephemeral (rebuilt each boot) - fine for a classroom session.
struct MeshPeer { uint16_t addr = 0; char id[24] = {0}; unsigned long lastSeen = 0; };
static const uint8_t MESH_PEER_MAX = 12;
MeshPeer meshPeers[MESH_PEER_MAX];

// Record/refresh a peer. Reuses an existing slot for the same addr or id;
// otherwise takes an empty slot, or evicts the stalest entry if the (small,
// classroom-sized) table is full rather than refusing a new peer.
void learnMeshPeer(uint16_t addr, const char* id) {
  int freeSlot = -1;
  for (uint8_t i = 0; i < MESH_PEER_MAX; i++) {
    if (meshPeers[i].lastSeen && (meshPeers[i].addr == addr || strncmp(meshPeers[i].id, id, sizeof(meshPeers[i].id)) == 0)) {
      meshPeers[i].addr = addr;
      strlcpy(meshPeers[i].id, id, sizeof(meshPeers[i].id));
      meshPeers[i].lastSeen = millis();
      return;
    }
    if (!meshPeers[i].lastSeen && freeSlot < 0) freeSlot = i;
  }
  if (freeSlot < 0) {
    freeSlot = 0;
    for (uint8_t i = 1; i < MESH_PEER_MAX; i++) {
      if (meshPeers[i].lastSeen < meshPeers[freeSlot].lastSeen) freeSlot = i;
    }
  }
  meshPeers[freeSlot].addr = addr;
  strlcpy(meshPeers[freeSlot].id, id, sizeof(meshPeers[freeSlot].id));
  meshPeers[freeSlot].lastSeen = millis();
}

uint16_t lookupMeshPeerAddr(const char* id) {
  for (uint8_t i = 0; i < MESH_PEER_MAX; i++) {
    if (meshPeers[i].lastSeen && strncmp(meshPeers[i].id, id, sizeof(meshPeers[i].id)) == 0) return meshPeers[i].addr;
  }
  return 0;
}

// Actuators — only attached when `peripheral` selects them, so a bare node wastes
// no pins/timers. doorServo for peripheral=door; left/right for peripheral=drive.
Servo doorServo;
Servo driveLeft;
Servo driveRight;
bool doorEnabled  = false;
bool driveEnabled = false;
bool relayEnabled = false;
String doorState = "closed";          // reported in heartbeat
String driveDir  = "stop";            // last drive direction
bool relayOn = false;                 // relay/light state
bool gantryEnabled = false;
float gantryX = 0, gantryY = 0;       // last commanded gantry position (mm)
bool dhtEnabled = false, ldrEnabled = false;
DHT dht(PIN_DHT, DHT22);              // constructed always; begun only if enabled
unsigned long lastDriveCmd = 0;       // for the deadman stop

volatile bool eStopActive = false;
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastBlink = 0;
bool ledOn = false;
// Threat button debounce.
bool btnLast = HIGH;
unsigned long lastBtnChange = 0;
static const unsigned long BTN_DEBOUNCE_MS = 50;

// ── LED helpers ──────────────────────────────────────────────────────────────
void setLed(bool on) {
  ledOn = on;
  digitalWrite(LED_PIN, (LED_ACTIVE_LOW ? !on : on));
}

// Topic helpers
String topicSensors() { return "tc/" + deviceId + "/sensors"; }
String topicState()   { return "tc/" + deviceId + "/state"; }
String topicEstop()   { return "tc/" + deviceId + "/cmd/estop"; }
String topicAlert()   { return "tc/" + deviceId + "/alert"; }
String topicDoor()    { return "tc/" + deviceId + "/cmd/door"; }
String topicDrive()   { return "tc/" + deviceId + "/cmd/drive"; }
String topicLight()   { return "tc/" + deviceId + "/cmd/light"; }

// Relay/light: drive any farm load on/off (heat lamp, pump, fan, grow light).
void applyLight(bool on) {
  if (!relayEnabled || eStopActive) return;
  relayOn = on;
  digitalWrite(PIN_RELAY, on ? HIGH : LOW);
}

String topicGantry() { return "tc/" + deviceId + "/cmd/gantry"; }

// Send one G-code line to the GRBL controller.
void grblSend(const char* line) { GRBL.print(line); GRBL.print('\n'); }

// Bridge an MQTT gantry command to GRBL. Supports coordinate moves {x,y,speed} and
// real-time controls {cmd: home|unlock|hold|resume|stop}. GRBL real-time bytes
// (!, ~, 0x18) are sent raw, not as G-code lines.
void handleGantry(JsonDocument& doc) {
  if (!gantryEnabled || eStopActive) return;
  String c = (const char*)(doc["cmd"] | "");
  if      (c == "home")   grblSend("$H");          // home against limit switches
  else if (c == "unlock") grblSend("$X");          // clear alarm after E-STOP
  else if (c == "hold")   GRBL.write('!');         // feed hold
  else if (c == "resume") GRBL.write('~');         // cycle resume
  else if (c == "stop") { GRBL.write('!'); GRBL.write(0x18); }  // hold + soft reset
  else {
    // Coordinate move in mm. speed 0..1 maps to feed rate.
    float x = doc["x"] | gantryX;
    float y = doc["y"] | gantryY;
    float sp = doc["speed"] | 0.5f;
    if (sp < 0) sp = 0; if (sp > 1) sp = 1;
    int feed = 200 + (int)(sp * 2800);             // 200..3000 mm/min
    char line[56];
    snprintf(line, sizeof(line), "G90 G21 G1 X%.2f Y%.2f F%d", x, y, feed);
    grblSend(line);
    gantryX = x; gantryY = y;
  }
}

// ── Actuators ────────────────────────────────────────────────────────────────
// Stop both drive servos (center = no rotation). Safe to call even if not attached.
void stopDrive() {
  if (!driveEnabled) return;
  driveLeft.write(DRIVE_STOP_DEG);
  driveRight.write(DRIVE_STOP_DEG);
  driveDir = "stop";
}

// Differential drive from a direction + 0..1 speed. Mirrors the Roaming Roost
// cmd/drive contract so the OS controls the classroom rover identically.
void applyDrive(const char* dir, float speed) {
  if (!driveEnabled || eStopActive) return;
  if (speed < 0) speed = 0;
  if (speed > 1) speed = 1;
  int off = (int)(DRIVE_SPAN_DEG * speed);
  // Servos face opposite ways on a chassis, so "forward" = left fwd + right rev.
  int l = DRIVE_STOP_DEG, r = DRIVE_STOP_DEG;
  String d = dir ? String(dir) : String("stop");
  if      (d == "forward") { l = DRIVE_STOP_DEG + off; r = DRIVE_STOP_DEG - off; }
  else if (d == "back")    { l = DRIVE_STOP_DEG - off; r = DRIVE_STOP_DEG + off; }
  else if (d == "left")    { l = DRIVE_STOP_DEG - off; r = DRIVE_STOP_DEG - off; }
  else if (d == "right")   { l = DRIVE_STOP_DEG + off; r = DRIVE_STOP_DEG + off; }
  else                     { stopDrive(); return; }  // "stop" or unknown → halt
  driveLeft.write(l);
  driveRight.write(r);
  driveDir = d;
  lastDriveCmd = millis();
}

// Swing the door servo open/closed.
void applyDoor(const char* state) {
  if (!doorEnabled || eStopActive) return;
  String s = state ? String(state) : String("close");
  if (s == "open") { doorServo.write(DOOR_OPEN_DEG);  doorState = "open"; }
  else             { doorServo.write(DOOR_CLOSE_DEG); doorState = "closed"; }
}

// ── Send telemetry out over MQTT (normal boards) or the LoRa mesh (meshOnly
// boards) - same JSON payload either way, so a bridge/dashboard can't tell
// which transport a board used. Mesh has no topic, so the payload is stamped
// with our own id/address; a bridge republishes it onto tc/<id>/sensors (and
// tc/<id>/state too, if a "state" field is present) exactly as if we'd sent
// it over MQTT directly. ──────────────────────────────────────────────────
void sendOut(const char* mqttTopic, JsonDocument& doc, bool retain) {
  if (meshOnly) {
    if (!meshAttached) return;
    doc["id"]   = deviceId;
    doc["addr"] = mesh.nodeAddr();
    uint8_t buf[TC_MESH_MAX_PAYLOAD];
    size_t n = serializeJson(doc, (char*)buf, sizeof(buf));
    mesh.sendBroadcast(TC_MSG_HEARTBEAT, buf, (uint8_t)n);
  } else {
    char buf[256];
    size_t n = serializeJson(doc, buf, sizeof(buf));
    mqtt.publish(mqttTopic, (const uint8_t*)buf, n, retain);
  }
}

// ── Publish current state (retained when E-STOP, like the coop controller) ───
void publishState(const char* state) {
  StaticJsonDocument<192> doc;
  doc["state"]    = state;
  doc["uptime"]   = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["rssi"]     = WiFi.RSSI();
  doc["ts"]       = millis();
  sendOut(topicState().c_str(), doc, strcmp(state, "estop") == 0);
}

// ── Heartbeat as a sensors payload so it renders on the dashboard ────────────
void publishHeartbeat() {
  StaticJsonDocument<192> doc;
  // Starter Node has no real sensors — report a harmless, obviously-fake set so
  // it is visibly distinguishable from a real coop while still exercising the path.
  // Real readings when a sensor peripheral is attached; 0 otherwise. Average 3
  // samples (project rule: smooth before publishing).
  float t = 0, h = 0;
  if (dhtEnabled) {
    int n = 0; float ts = 0, hs = 0;
    for (int i = 0; i < 3; i++) {
      float rt = dht.readTemperature(true), rh = dht.readHumidity();  // °F, %
      if (!isnan(rt) && !isnan(rh)) { ts += rt; hs += rh; n++; }
    }
    if (n) { t = ts / n; h = hs / n; }
  }
  doc["temp"]         = t;
  doc["humidity"]     = h;
  if (ldrEnabled) {
    long s = 0; for (int i = 0; i < 3; i++) s += analogRead(PIN_LDR);
    doc["light"] = (int)(s / 3);
  }
  doc["ammonia"]      = 0;
  doc["feedLevel"]    = 0;
  doc["waterLevel"]   = 0;
  doc["chickenCount"] = 0;
  doc["node"]         = "starter";
  doc["productType"]  = productType;  // which product this node stands in for
  if (species.length())     doc["species"] = species;
  if (threatLabel.length()) doc["threat"]  = threatLabel;
  if (peripheral.length())  doc["peripheral"] = peripheral;  // camera / sensor it carries
  // Report live actuator state so the dashboard shows door/rover position.
  if (doorEnabled)  doc["doorState"] = doorState;
  if (driveEnabled) doc["driveDir"]  = driveDir;
  if (relayEnabled) doc["relayOn"]   = relayOn;
  if (gantryEnabled) { doc["gantryX"] = gantryX; doc["gantryY"] = gantryY; }
  doc["freeHeap"]     = ESP.getFreeHeap();
  doc["ts"]           = millis();
  sendOut(topicSensors().c_str(), doc, false);
}

// ── Threat alert (button-triggered) ──────────────────────────────────────────
// Publishes a learner-defined threat to tc/{id}/alert so it shows up in the app
// exactly like a real predator detection. Same alert schema the platform uses.
void publishThreat() {
  if (!meshOnly && !mqtt.connected()) return;
  StaticJsonDocument<192> doc;
  doc["type"]       = threatLabel.length() ? threatLabel : String("predator");
  doc["species"]    = species;
  doc["confidence"] = 1.0;        // manual trigger = certain
  doc["manual"]     = true;       // distinguishes a learner press from real inference
  doc["src"]        = deviceId;
  doc["ts"]         = millis();
  // Alerts aren't a "state" - broadcast as TC_MSG_ALERT (like watchtower's real
  // predator alerts) rather than through sendOut's heartbeat framing, so a
  // bridge relays it straight onto tc/broadcast/alert.
  if (meshOnly) {
    if (!meshAttached) return;
    uint8_t buf[TC_MESH_MAX_PAYLOAD];
    size_t n = serializeJson(doc, (char*)buf, sizeof(buf));
    mesh.sendBroadcast(TC_MSG_ALERT, buf, (uint8_t)n);
  } else {
    char buf[192];
    size_t n = serializeJson(doc, buf, sizeof(buf));
    mqtt.publish(topicAlert().c_str(), (const uint8_t*)buf, n, false);
  }
  Serial.printf("[ALERT] threat fired: %s (species=%s)\n",
                doc["type"].as<const char*>(), species.c_str());
}

// ── E-STOP ───────────────────────────────────────────────────────────────────
void enterEStop() {
  if (eStopActive) return;
  eStopActive = true;
  stopDrive();          // freeze the rover instantly — motion is the hazard
  if (relayEnabled) { digitalWrite(PIN_RELAY, LOW); relayOn = false; }  // cut load
  if (gantryEnabled) { GRBL.write('!'); GRBL.write(0x18); }  // GRBL feed-hold + reset
  setLed(false);
  publishState("estop");
  Serial.println("[ESTOP] active — node frozen until cleared");
}
void clearEStop() {
  if (!eStopActive) return;
  eStopActive = false;
  publishState("idle");
  Serial.println("[ESTOP] cleared");
}

// Dispatch one decoded command by its logical kind ("estop"/"door"/"drive"/
// "relay"/"gantry" - an MQTT topic's last segment, or a mesh TC_MSG_COMMAND's
// "topic" field). Shared by onMqttMessage and handleMeshCommand so a WiFi
// board and a meshOnly board run the exact same actuator logic - no second
// copy to drift out of sync with the E-STOP-first safety ordering.
void applyCommand(const String& kind, JsonDocument& doc) {
  if (kind == "estop") {
    bool active = doc["active"] | false;
    if (active) enterEStop();
    else clearEStop();
    return;
  }
  // Actuation commands are refused while E-STOP is latched (safety first).
  if (eStopActive) return;
  if (doorEnabled && kind == "door") {
    applyDoor(doc["state"] | "close");
  } else if (driveEnabled && kind == "drive") {
    applyDrive(doc["dir"] | "stop", doc["speed"] | 0.5f);
  } else if (relayEnabled && kind == "relay") {
    applyLight(doc["on"] | false);
  } else if (gantryEnabled && kind == "gantry") {
    handleGantry(doc);
  }
}

// A directed mesh command addressed to us (poll() already filtered dest==_addr).
void handleMeshCommand(const uint8_t* payload, uint8_t len) {
  StaticJsonDocument<200> doc;
  if (deserializeJson(doc, payload, len)) return;
  String kind = doc["topic"] | "";
  if (kind.length()) applyCommand(kind, doc);
}

// ── LoRa mesh receive ─────────────────────────────────────────────────────────
// meshOnly boards: TC_MSG_COMMAND is how the bridge controls us (no MQTT to
// receive on). Any board with a radio attached (WiFi-connected or not) also
// bridges: learns mesh-only peers from their heartbeats and relays their
// telemetry to MQTT, plus relays alerts, so the dashboard sees them exactly
// like a WiFi-connected board.
void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload,
                    uint8_t len, int rssi) {
  switch (type) {
    case TC_MSG_HEARTBEAT: {
      if (!mqtt.connected()) break;  // nothing to bridge onto
      StaticJsonDocument<200> doc;
      if (deserializeJson(doc, payload, len)) break;
      const char* peerId = doc["id"] | "";
      if (!peerId[0]) break;
      learnMeshPeer(src, peerId);
      mqtt.publish(("tc/" + String(peerId) + "/sensors").c_str(), payload, len, false);
      if (!doc["state"].isNull()) {
        bool retain = strcmp(doc["state"] | "", "estop") == 0;
        mqtt.publish(("tc/" + String(peerId) + "/state").c_str(), payload, len, retain);
      }
      break;
    }
    case TC_MSG_ALERT:
      Serial.printf("[Mesh] Alert from 0x%04X (rssi=%d): %.*s\n", src, rssi, len, (const char*)payload);
      if (mqtt.connected()) mqtt.publish("tc/broadcast/alert", payload, len, false);
      break;
    case TC_MSG_ESTOP:
      // Fail-safe direction only (see tc_mesh.h) - entering is always allowed.
      Serial.printf("[Mesh] ESTOP from 0x%04X — entering ESTOP\n", src);
      enterEStop();
      break;
    case TC_MSG_COMMAND:
      handleMeshCommand(payload, len);
      break;
    default:
      break;
  }
}

// ── MQTT message handler — E-STOP parsed first ───────────────────────────────
void onMqttMessage(char* topic, byte* payload, unsigned int len) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, len)) return;  // ignore non-JSON
  String t = String(topic);

  if (t == topicEstop()) { applyCommand("estop", doc); return; }
  if (doorEnabled  && t == topicDoor())  { applyCommand("door",  doc); return; }
  if (driveEnabled && t == topicDrive()) { applyCommand("drive", doc); return; }
  if (relayEnabled && t == topicLight()) { applyCommand("relay", doc); return; }
  if (gantryEnabled && t == topicGantry()) { applyCommand("gantry", doc); return; }

  // Not one of our own topics. If we're bridging (radio attached) and this is
  // a command for a mesh peer we've heard from ("tc/<peerId>/cmd/<kind>"),
  // relay it over LoRa instead of dropping it - the mesh-only board never
  // subscribes to MQTT itself, so this is its only path to receive commands.
  if (!meshAttached) return;
  int p1 = t.indexOf('/');
  int p2 = t.indexOf("/cmd/");
  if (p1 != 2 || p2 < 0) return;
  String peerId = t.substring(p1 + 1, p2);
  uint16_t addr = lookupMeshPeerAddr(peerId.c_str());
  if (!addr) return;  // unknown peer - nothing to relay to
  doc["topic"] = t.substring(p2 + 5);
  uint8_t buf[TC_MESH_MAX_PAYLOAD];
  size_t n = serializeJson(doc, (char*)buf, sizeof(buf));
  mesh.sendTo(addr, TC_MSG_COMMAND, buf, (uint8_t)n);
}

void subscribeCommands() {
  // E-STOP retained + QoS — same contract as the coop controller.
  mqtt.subscribe(topicEstop().c_str(), 1);
  // Only subscribe to the actuator this board actually carries.
  if (doorEnabled)  mqtt.subscribe(topicDoor().c_str(), 1);
  if (driveEnabled) mqtt.subscribe(topicDrive().c_str(), 1);
  if (relayEnabled) mqtt.subscribe(topicLight().c_str(), 1);
  if (gantryEnabled) mqtt.subscribe(topicGantry().c_str(), 1);
  // Bridge role: hear commands meant for any mesh peer so they can be relayed.
  if (meshAttached) mqtt.subscribe("tc/+/cmd/+", 1);
}

bool reconnectMqtt() {
  String clientId = "tc-starter-" + deviceId + "-" + String((uint32_t)esp_random(), HEX);
  if (mqtt.connect(clientId.c_str())) {
    Serial.println("[MQTT] connected");
    subscribeCommands();
    publishState(eStopActive ? "estop" : "idle");
    return true;
  }
  Serial.printf("[MQTT] connect failed rc=%d\n", mqtt.state());
  return false;
}

// ── Captive-portal provisioning (no hardcoded secrets) ───────────────────────
void provisionConfig() {
  prefs.begin("tcnode", false);
  brokerIp     = prefs.getString("brokerIp", "");
  brokerPort   = prefs.getString("brokerPort", "1883");
  deviceId     = prefs.getString("deviceId", "");
  productType  = prefs.getString("product", "starter");
  species      = prefs.getString("species", "");
  threatLabel  = prefs.getString("threat", "predator");
  peripheral   = prefs.getString("peripheral", "none");
  meshOnlyPref = prefs.getString("meshOnly", "no");
  bool alreadyConfigured = prefs.getString("configured", "") == "yes";

  // Default device id from chip MAC if unset.
  if (deviceId.isEmpty()) {
    uint64_t mac = ESP.getEfuseMac();
    char id[24];
    snprintf(id, sizeof(id), "node_%04X", (uint16_t)(mac & 0xFFFF));
    deviceId = id;
  }

  // A meshOnly board that has already been through the one-time setup form
  // never opens the "TenderNode-Setup" AP again - it goes straight to mesh
  // operation on every subsequent boot, so it never touches WiFi at all
  // (not even its own throwaway config AP) once a student has flashed and
  // configured it once. Re-flash (which clears NVS) to reconfigure.
  if (alreadyConfigured && meshOnlyPref == "yes") {
    meshOnly = true;
    prefs.end();
    Serial.printf("[MESH] meshOnly=yes (configured) | id=%s | product=%s\n",
                  deviceId.c_str(), productType.c_str());
    return;
  }

  WiFiManager wm;
  WiFiManagerParameter pBroker("broker", "Broker IP (leave blank to auto-find)", brokerIp.c_str(), 40);
  WiFiManagerParameter pPort("port", "Broker port", brokerPort.c_str(), 6);
  WiFiManagerParameter pId("devid", "Device ID", deviceId.c_str(), 22);
  // Which product this node represents. Same firmware, any product type — type one of:
  // starter, chicken-tender, roaming-roost, duck-dock, bunny-burrow, goat-guardian,
  // turkey-tower, pigeon-palace, watchtower, or "custom" for an invented device.
  WiFiManagerParameter pProduct("product", "Product type", productType.c_str(), 20);
  // School/maker fields: name your animal + the threat your project detects.
  WiFiManagerParameter pSpecies("species", "Species (e.g. axolotl) — optional", species.c_str(), 24);
  WiFiManagerParameter pThreat("threat", "Threat label (button fires this)", threatLabel.c_str(), 20);
  // What this board carries. Sensors: none, camera, temp-humidity, ammonia, load-cell.
  // Actuators (controllable from the OS): door (servo), drive (Roaming Roost), relay
  // (lamp/pump/fan/light), gantry (GRBL). Or any free-text for a custom build.
  WiFiManagerParameter pPeripheral("peripheral", "Item on board: none, camera, temp-humidity, ammonia, load-cell, door, drive, relay, gantry", peripheral.c_str(), 40);
  // No school/production WiFi password needed for this board at all, ever
  // again after this one-time form: type "yes" and leave WiFi SSID/password
  // blank. Needs one other board nearby with a LoRa radio AND real WiFi to
  // bridge it - any board with a radio does this automatically.
  WiFiManagerParameter pMeshOnly("meshonly", "Join classroom LoRa mesh only - no WiFi/broker needed (type yes or leave blank)", meshOnlyPref.c_str(), 6);
  wm.addParameter(&pBroker);
  wm.addParameter(&pPort);
  wm.addParameter(&pId);
  wm.addParameter(&pProduct);
  wm.addParameter(&pSpecies);
  wm.addParameter(&pThreat);
  wm.addParameter(&pPeripheral);
  wm.addParameter(&pMeshOnly);

  // Blink while waiting for setup so the user knows it's in portal mode.
  wm.setConfigPortalTimeout(0);  // stay until configured
  Serial.println("[WIFI] Starting setup portal 'TenderNode-Setup' ...");
  bool ok = wm.autoConnect("TenderNode-Setup");

  brokerIp     = pBroker.getValue();
  brokerPort   = pPort.getValue();
  deviceId     = pId.getValue();
  productType  = pProduct.getValue();
  species      = pSpecies.getValue();
  threatLabel  = pThreat.getValue();
  peripheral   = pPeripheral.getValue();
  meshOnlyPref = pMeshOnly.getValue();
  if (productType.isEmpty()) productType = "starter";
  if (threatLabel.isEmpty()) threatLabel = "predator";
  if (peripheral.isEmpty())  peripheral = "none";
  meshOnlyPref.toLowerCase();
  meshOnly = (meshOnlyPref == "yes");
  prefs.putString("brokerIp", brokerIp);
  prefs.putString("brokerPort", brokerPort);
  prefs.putString("deviceId", deviceId);
  prefs.putString("product", productType);
  prefs.putString("species", species);
  prefs.putString("threat", threatLabel);
  prefs.putString("peripheral", peripheral);
  prefs.putString("meshOnly", meshOnly ? "yes" : "no");
  prefs.putString("configured", "yes");
  prefs.end();

  Serial.printf("[WIFI] %s | broker=%s:%s | id=%s | product=%s | species=%s | threat=%s | meshOnly=%s\n",
                ok ? "connected" : "NOT connected", brokerIp.c_str(),
                brokerPort.c_str(), deviceId.c_str(), productType.c_str(),
                species.c_str(), threatLabel.c_str(), meshOnly ? "yes" : "no");
}

// ── mDNS broker discovery ─────────────────────────────────────────────────────
// If the learner left the broker IP blank, find the demo broker on the LAN by its
// advertised _mqtt._tcp service (express-api advertises this). Removes IP-typing —
// the #1 classroom stumble. Runs BEFORE the watchdog is armed (query blocks ~3s).
void discoverBrokerIfNeeded() {
  if (brokerIp.length()) return;             // user gave an explicit IP — respect it
  if (WiFi.status() != WL_CONNECTED) return; // no LAN, nothing to find
  if (!MDNS.begin(deviceId.c_str())) {
    Serial.println("[mDNS] init failed — set the broker IP manually");
    return;
  }
  Serial.println("[mDNS] searching for _mqtt._tcp broker ...");
  int n = MDNS.queryService("mqtt", "tcp");
  if (n <= 0) {
    Serial.println("[mDNS] no broker found — set the broker IP manually");
    return;
  }
  brokerIp   = MDNS.IP(0).toString();
  brokerPort = String(MDNS.port(0));
  Serial.printf("[mDNS] found broker %s:%s\n", brokerIp.c_str(), brokerPort.c_str());
}

// ── Threat button (debounced, non-blocking) ──────────────────────────────────
void handleThreatButton() {
  bool reading = digitalRead(BTN_PIN);
  if (reading != btnLast) lastBtnChange = millis();
  // Fire once on a stable HIGH→LOW transition (press).
  if ((millis() - lastBtnChange) > BTN_DEBOUNCE_MS && reading == LOW && btnLast == HIGH) {
    publishThreat();
  }
  btnLast = reading;
}

void setup() {
  Serial.begin(115200);
  delay(50);  // let USB-CDC enumerate (one-time, not in loop)
  Serial.println("\n=== Tender Cells Starter Node ===");
  Serial.printf("Chip: %s rev%d | Flash: %uMB\n",
                ESP.getChipModel(), ESP.getChipRevision(),
                ESP.getFlashChipSize() / (1024 * 1024));

  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);  // BOOT button = threat trigger
  setLed(false);

  // Provision FIRST — the captive portal blocks until the user configures WiFi,
  // which is far longer than the 8s watchdog. Arming the watchdog before this
  // would panic-reboot the board mid-portal (AP flickers, "never asks for WiFi").
  provisionConfig();

  // Auto-find the broker if no IP was entered (blocks ~3s — before watchdog arm).
  // Skipped entirely for meshOnly - it never touches WiFi/MQTT.
  if (!meshOnly) discoverBrokerIfNeeded();

  // LoRa mesh radio - optional and independent of meshOnly: any board with a
  // module wired (WiFi-connected or not) gets one, so a WiFi board can also
  // bridge nearby meshOnly boards. Degrades to "no mesh" if no radio answers.
  meshAttached = mesh.begin(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);
  if (meshAttached) {
    mesh.onMessage(onMeshMessage);
    Serial.printf("[Mesh] ready, node addr 0x%04X\n", mesh.nodeAddr());
  } else if (meshOnly) {
    Serial.println("[Mesh] meshOnly=yes but no LoRa radio answered - this board is isolated");
  } else {
    Serial.println("[Mesh] no radio - continuing WiFi/MQTT only");
  }

  // Attach only the actuator this board carries (set during WiFi setup, Step 4).
  // ESP32Servo needs an LEDC timer per servo, so we don't grab them on a bare node.
  if (peripheral == "door") {
    doorEnabled = true;
    doorServo.setPeriodHertz(50);
    doorServo.attach(PIN_DOOR_SERVO, 500, 2400);
    applyDoor("close");  // known safe start state
    Serial.printf("[ACT] door servo on GPIO%d\n", PIN_DOOR_SERVO);
  } else if (peripheral == "drive") {
    driveEnabled = true;
    driveLeft.setPeriodHertz(50);
    driveRight.setPeriodHertz(50);
    driveLeft.attach(PIN_DRIVE_LEFT, 500, 2400);
    driveRight.attach(PIN_DRIVE_RIGHT, 500, 2400);
    stopDrive();         // never roll on boot
    Serial.printf("[ACT] drive servos on GPIO%d/%d (basic Roaming Roost)\n",
                  PIN_DRIVE_LEFT, PIN_DRIVE_RIGHT);
  } else if (peripheral == "relay") {
    relayEnabled = true;
    pinMode(PIN_RELAY, OUTPUT);
    digitalWrite(PIN_RELAY, LOW);  // load OFF on boot
    Serial.printf("[ACT] relay on GPIO%d (heat lamp / pump / fan / light)\n", PIN_RELAY);
  } else if (peripheral == "gantry") {
    gantryEnabled = true;
    GRBL.begin(115200, SERIAL_8N1, PIN_GRBL_RX, PIN_GRBL_TX);
    grblSend("");        // wake GRBL
    grblSend("G21 G90"); // mm, absolute — no auto-home (let the OS command $H)
    Serial.printf("[ACT] GRBL gantry bridge on UART TX%d/RX%d\n", PIN_GRBL_TX, PIN_GRBL_RX);
  } else if (peripheral == "temp-humidity") {
    dhtEnabled = true;
    dht.begin();
    Serial.printf("[SENSE] DHT22 on GPIO%d\n", PIN_DHT);
  } else if (peripheral == "light") {
    ldrEnabled = true;
    pinMode(PIN_LDR, INPUT);
    Serial.printf("[SENSE] LDR on GPIO%d\n", PIN_LDR);
  }

  // Now arm the watchdog for the steady-state loop().
  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  if (!meshOnly) {
    uint16_t port = (uint16_t)brokerPort.toInt();
    if (port == 0) port = 1883;
    mqtt.setServer(brokerIp.c_str(), port);
    mqtt.setCallback(onMqttMessage);
    // Socket timeout MUST stay below the 8s watchdog. PubSubClient defaults to 15s,
    // so a wrong/unreachable broker IP would block connect() past the watchdog and
    // reboot-loop the board forever (looks like "it flashed but does nothing"). 4s
    // fails fast so loop() can retry without tripping the watchdog.
    mqtt.setSocketTimeout(4);
  }

  Serial.println(meshOnly
    ? "Setup done — mesh-only, no WiFi/broker. Heartbeat every 10s over LoRa."
    : "Setup done — heartbeat every 10s, LED blinks when alive.");
}

void loop() {
  esp_task_wdt_reset();

  // E-STOP wins, always.
  if (eStopActive) {
    setLed(false);
    if (!meshOnly) mqtt.loop();
    if (meshAttached) mesh.poll();
    return;
  }

  if (!meshOnly) {
    // Non-blocking MQTT reconnect.
    if (!mqtt.connected()) {
      setLed(false);
      if (millis() - lastReconnectAttempt > MQTT_RECONNECT_MS) {
        lastReconnectAttempt = millis();
        reconnectMqtt();
      }
      if (meshAttached) mesh.poll();  // keep bridging even while MQTT is down
      return;
    }
    mqtt.loop();
  }
  if (meshAttached) mesh.poll();

  // Learner can fire a threat alert anytime with the BOOT button.
  handleThreatButton();

  // Drive deadman: if the rover is moving but no fresh command arrived recently,
  // stop it. Protects against lost WiFi / closed app leaving motors running.
  if (driveEnabled && driveDir != "stop" && millis() - lastDriveCmd > DRIVE_DEADMAN_MS) {
    stopDrive();
    Serial.println("[DRIVE] deadman stop — no command in window");
  }

  // Slow "alive" blink (500ms toggle) — no blocking delay.
  if (millis() - lastBlink > 500) {
    lastBlink = millis();
    setLed(!ledOn);
  }

  // Heartbeat.
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    publishHeartbeat();
    publishState("idle");
  }
}
