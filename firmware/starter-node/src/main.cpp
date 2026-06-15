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
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_task_wdt.h>

// ── Board ──────────────────────────────────────────────────────────────────
// XIAO ESP32-S3 user LED is on GPIO21 and is active-LOW.
static const int LED_PIN = 21;
static const bool LED_ACTIVE_LOW = true;

// ── Timing ─────────────────────────────────────────────────────────────────
static const unsigned long HEARTBEAT_INTERVAL_MS = 10000;  // matches sensor cadence
static const unsigned long MQTT_RECONNECT_MS      = 5000;
static const unsigned long WATCHDOG_TIMEOUT_S     = 8;

// ── Provisioned config (stored in NVS, never hardcoded) ──────────────────────
Preferences prefs;
String brokerIp;
String brokerPort;
String deviceId;

// ── Runtime ──────────────────────────────────────────────────────────────────
WiFiClient net;
PubSubClient mqtt(net);

volatile bool eStopActive = false;
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastBlink = 0;
bool ledOn = false;

// ── LED helpers ──────────────────────────────────────────────────────────────
void setLed(bool on) {
  ledOn = on;
  digitalWrite(LED_PIN, (LED_ACTIVE_LOW ? !on : on));
}

// Topic helpers
String topicSensors() { return "tc/" + deviceId + "/sensors"; }
String topicState()   { return "tc/" + deviceId + "/state"; }
String topicEstop()   { return "tc/" + deviceId + "/cmd/estop"; }

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
  doc["freeHeap"]     = ESP.getFreeHeap();
  doc["ts"]           = millis();
  char buf[192];
  size_t n = serializeJson(doc, buf);
  mqtt.publish(topicSensors().c_str(), (const uint8_t*)buf, n);
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
  brokerIp   = prefs.getString("brokerIp", "");
  brokerPort = prefs.getString("brokerPort", "1883");
  deviceId   = prefs.getString("deviceId", "");

  // Default device id from chip MAC if unset.
  if (deviceId.isEmpty()) {
    uint64_t mac = ESP.getEfuseMac();
    char id[24];
    snprintf(id, sizeof(id), "node_%04X", (uint16_t)(mac & 0xFFFF));
    deviceId = id;
  }

  WiFiManager wm;
  WiFiManagerParameter pBroker("broker", "Broker IP (from `npm run demo`)", brokerIp.c_str(), 40);
  WiFiManagerParameter pPort("port", "Broker port", brokerPort.c_str(), 6);
  WiFiManagerParameter pId("devid", "Device ID", deviceId.c_str(), 22);
  wm.addParameter(&pBroker);
  wm.addParameter(&pPort);
  wm.addParameter(&pId);

  // Blink while waiting for setup so the user knows it's in portal mode.
  wm.setConfigPortalTimeout(0);  // stay until configured
  Serial.println("[WIFI] Starting setup portal 'TenderNode-Setup' ...");
  bool ok = wm.autoConnect("TenderNode-Setup");

  brokerIp   = pBroker.getValue();
  brokerPort = pPort.getValue();
  deviceId   = pId.getValue();
  prefs.putString("brokerIp", brokerIp);
  prefs.putString("brokerPort", brokerPort);
  prefs.putString("deviceId", deviceId);
  prefs.end();

  Serial.printf("[WIFI] %s | broker=%s:%s | id=%s\n",
                ok ? "connected" : "NOT connected", brokerIp.c_str(),
                brokerPort.c_str(), deviceId.c_str());
}

void setup() {
  Serial.begin(115200);
  delay(50);  // let USB-CDC enumerate (one-time, not in loop)
  Serial.println("\n=== Tender Cells Starter Node ===");
  Serial.printf("Chip: %s rev%d | Flash: %uMB\n",
                ESP.getChipModel(), ESP.getChipRevision(),
                ESP.getFlashChipSize() / (1024 * 1024));

  pinMode(LED_PIN, OUTPUT);
  setLed(false);

  // Provision FIRST — the captive portal blocks until the user configures WiFi,
  // which is far longer than the 8s watchdog. Arming the watchdog before this
  // would panic-reboot the board mid-portal (AP flickers, "never asks for WiFi").
  provisionConfig();

  // Now arm the watchdog for the steady-state loop().
  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  uint16_t port = (uint16_t)brokerPort.toInt();
  if (port == 0) port = 1883;
  mqtt.setServer(brokerIp.c_str(), port);
  mqtt.setCallback(onMqttMessage);

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
