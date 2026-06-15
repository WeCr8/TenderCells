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

// ── Board ──────────────────────────────────────────────────────────────────
// XIAO ESP32-S3 user LED is on GPIO21 and is active-LOW.
static const int LED_PIN = 21;
static const bool LED_ACTIVE_LOW = true;
// BOOT button (GPIO0, active-LOW) doubles as the "trigger a threat" button so a
// learner can make an alert fire with no extra wiring. Press = publish a threat.
static const int BTN_PIN = 0;

// ── Timing ─────────────────────────────────────────────────────────────────
static const unsigned long HEARTBEAT_INTERVAL_MS = 10000;  // matches sensor cadence
static const unsigned long MQTT_RECONNECT_MS      = 5000;
static const unsigned long WATCHDOG_TIMEOUT_S     = 8;

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

// ── Runtime ──────────────────────────────────────────────────────────────────
WiFiClient net;
PubSubClient mqtt(net);

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

// ── Publish current state (retained when E-STOP, like the coop controller) ───
void publishState(const char* state) {
  StaticJsonDocument<192> doc;
  doc["state"]    = state;
  doc["uptime"]   = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["rssi"]     = WiFi.RSSI();
  doc["ts"]       = millis();
  char buf[192];
  size_t n = serializeJson(doc, buf);
  bool retain = (strcmp(state, "estop") == 0);
  mqtt.publish(topicState().c_str(), (const uint8_t*)buf, n, retain);
}

// ── Heartbeat as a sensors payload so it renders on the dashboard ────────────
void publishHeartbeat() {
  StaticJsonDocument<192> doc;
  // Starter Node has no real sensors — report a harmless, obviously-fake set so
  // it is visibly distinguishable from a real coop while still exercising the path.
  doc["temp"]         = 0;
  doc["humidity"]     = 0;
  doc["ammonia"]      = 0;
  doc["feedLevel"]    = 0;
  doc["waterLevel"]   = 0;
  doc["chickenCount"] = 0;
  doc["node"]         = "starter";
  doc["productType"]  = productType;  // which product this node stands in for
  if (species.length())     doc["species"] = species;
  if (threatLabel.length()) doc["threat"]  = threatLabel;
  if (peripheral.length())  doc["peripheral"] = peripheral;  // camera / sensor it carries
  doc["freeHeap"]     = ESP.getFreeHeap();
  doc["ts"]           = millis();
  char buf[256];
  size_t n = serializeJson(doc, buf);
  mqtt.publish(topicSensors().c_str(), (const uint8_t*)buf, n);
}

// ── Threat alert (button-triggered) ──────────────────────────────────────────
// Publishes a learner-defined threat to tc/{id}/alert so it shows up in the app
// exactly like a real predator detection. Same alert schema the platform uses.
void publishThreat() {
  if (!mqtt.connected()) return;
  StaticJsonDocument<192> doc;
  doc["type"]       = threatLabel.length() ? threatLabel : String("predator");
  doc["species"]    = species;
  doc["confidence"] = 1.0;        // manual trigger = certain
  doc["manual"]     = true;       // distinguishes a learner press from real inference
  doc["src"]        = deviceId;
  doc["ts"]         = millis();
  char buf[192];
  size_t n = serializeJson(doc, buf);
  mqtt.publish(topicAlert().c_str(), (const uint8_t*)buf, n, false);
  Serial.printf("[ALERT] threat fired: %s (species=%s)\n",
                doc["type"].as<const char*>(), species.c_str());
}

// ── E-STOP ───────────────────────────────────────────────────────────────────
void enterEStop() {
  if (eStopActive) return;
  eStopActive = true;
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

// ── MQTT message handler — E-STOP parsed first ───────────────────────────────
void onMqttMessage(char* topic, byte* payload, unsigned int len) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, len)) return;  // ignore non-JSON

  if (String(topic) == topicEstop()) {
    bool active = doc["active"] | false;
    if (active) enterEStop();
    else clearEStop();
  }
}

void subscribeCommands() {
  // E-STOP retained + QoS — same contract as the coop controller.
  mqtt.subscribe(topicEstop().c_str(), 1);
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
  brokerIp    = prefs.getString("brokerIp", "");
  brokerPort  = prefs.getString("brokerPort", "1883");
  deviceId    = prefs.getString("deviceId", "");
  productType = prefs.getString("product", "starter");
  species     = prefs.getString("species", "");
  threatLabel = prefs.getString("threat", "predator");
  peripheral  = prefs.getString("peripheral", "none");

  // Default device id from chip MAC if unset.
  if (deviceId.isEmpty()) {
    uint64_t mac = ESP.getEfuseMac();
    char id[24];
    snprintf(id, sizeof(id), "node_%04X", (uint16_t)(mac & 0xFFFF));
    deviceId = id;
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
  // What this board carries: none, camera, temp-humidity, ammonia, door, load-cell,
  // or any free-text for a custom build. "camera" marks a remote camera node.
  WiFiManagerParameter pPeripheral("peripheral", "Item/sensor on this board (none, camera, temp-humidity, ammonia, door, load-cell)", peripheral.c_str(), 24);
  wm.addParameter(&pBroker);
  wm.addParameter(&pPort);
  wm.addParameter(&pId);
  wm.addParameter(&pProduct);
  wm.addParameter(&pSpecies);
  wm.addParameter(&pThreat);
  wm.addParameter(&pPeripheral);

  // Blink while waiting for setup so the user knows it's in portal mode.
  wm.setConfigPortalTimeout(0);  // stay until configured
  Serial.println("[WIFI] Starting setup portal 'TenderNode-Setup' ...");
  bool ok = wm.autoConnect("TenderNode-Setup");

  brokerIp    = pBroker.getValue();
  brokerPort  = pPort.getValue();
  deviceId    = pId.getValue();
  productType = pProduct.getValue();
  species     = pSpecies.getValue();
  threatLabel = pThreat.getValue();
  peripheral  = pPeripheral.getValue();
  if (productType.isEmpty()) productType = "starter";
  if (threatLabel.isEmpty()) threatLabel = "predator";
  if (peripheral.isEmpty())  peripheral = "none";
  prefs.putString("brokerIp", brokerIp);
  prefs.putString("brokerPort", brokerPort);
  prefs.putString("deviceId", deviceId);
  prefs.putString("product", productType);
  prefs.putString("species", species);
  prefs.putString("threat", threatLabel);
  prefs.putString("peripheral", peripheral);
  prefs.end();

  Serial.printf("[WIFI] %s | broker=%s:%s | id=%s | product=%s | species=%s | threat=%s\n",
                ok ? "connected" : "NOT connected", brokerIp.c_str(),
                brokerPort.c_str(), deviceId.c_str(), productType.c_str(),
                species.c_str(), threatLabel.c_str());
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
  discoverBrokerIfNeeded();

  // Now arm the watchdog for the steady-state loop().
  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  uint16_t port = (uint16_t)brokerPort.toInt();
  if (port == 0) port = 1883;
  mqtt.setServer(brokerIp.c_str(), port);
  mqtt.setCallback(onMqttMessage);
  // Socket timeout MUST stay below the 8s watchdog. PubSubClient defaults to 15s,
  // so a wrong/unreachable broker IP would block connect() past the watchdog and
  // reboot-loop the board forever (looks like "it flashed but does nothing"). 4s
  // fails fast so loop() can retry without tripping the watchdog.
  mqtt.setSocketTimeout(4);

  Serial.println("Setup done — heartbeat every 10s, LED blinks when alive.");
}

void loop() {
  esp_task_wdt_reset();

  // E-STOP wins, always.
  if (eStopActive) {
    setLed(false);
    mqtt.loop();
    return;
  }

  // Non-blocking MQTT reconnect.
  if (!mqtt.connected()) {
    setLed(false);
    if (millis() - lastReconnectAttempt > MQTT_RECONNECT_MS) {
      lastReconnectAttempt = millis();
      reconnectMqtt();
    }
    return;
  }
  mqtt.loop();

  // Learner can fire a threat alert anytime with the BOOT button.
  handleThreatButton();

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
