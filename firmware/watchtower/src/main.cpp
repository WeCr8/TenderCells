// WatchTower AI — ESP32-S3 firmware
// Hardware: 3× AI-Thinker ESP32-CAM at 120° spacing, LoRa SX1276 915MHz
//           18650×3 11.1V 6Ah battery, 5W solar, MPPT charger
// MQTT topics: tc/{deviceId}/sensors, tc/{deviceId}/state, tc/{deviceId}/alert
//              tc/{deviceId}/cmd/estop (subscribe, QoS 2 retained)

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <LoRa.h>
#include "tc_mesh.h"          // shared Tender Cells LoRa mesh (firmware/shared/tc_mesh)
#include <esp_task_wdt.h>

// — Credentials (override at build time or from NVS flash) —
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_SSID"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YOUR_PASSWORD"
#endif
#ifndef MQTT_BROKER
#define MQTT_BROKER "192.168.1.100"
#endif
#ifndef DEVICE_ID
#define DEVICE_ID "wt_001"
#endif

// — Pin assignments —
#define LORA_SCK    18
#define LORA_MISO   19
#define LORA_MOSI   23
#define LORA_SS      5
#define LORA_RST    14
#define LORA_DIO0    2
#define SOLAR_ADC   34   // ADC1_CH6 — solar panel voltage divider
#define BATTERY_ADC 35   // ADC1_CH7 — battery voltage divider

// — Constants —
static const unsigned long SENSOR_INTERVAL_MS   = 10000;
static const unsigned long RECONNECT_INTERVAL_MS = 5000;
static const unsigned long WATCHDOG_TIMEOUT_MS  = 8000;
static const unsigned long LORA_BROADCAST_COOLDOWN_MS = 30000;
static const float BATTERY_CRITICAL_VOLTS       = 10.5f;
static const float BATTERY_LOW_VOLTS            = 11.1f;

// — Camera setup —
// WatchTower scales from a single fixed camera to a full 360° 3-camera dome.
// CAMERA_COUNT is set per build via -DWATCHTOWER_CAMERAS (1, 2, or 3); see
// platformio.ini. The inference loop iterates only the cameras that exist, and
// the count is reported in telemetry so the dashboard renders the right layout.
#ifndef WATCHTOWER_CAMERAS
#define WATCHTOWER_CAMERAS 3
#endif
#if WATCHTOWER_CAMERAS < 1 || WATCHTOWER_CAMERAS > 3
#error "WATCHTOWER_CAMERAS must be 1, 2, or 3"
#endif
static const int CAMERA_COUNT = WATCHTOWER_CAMERAS;
// Mounting bearing of each camera (degrees); only the first CAMERA_COUNT are used.
// 1 cam → forward only; 2 → 180° apart; 3 → 120° apart (full perimeter).
static const int CAMERA_BEARINGS_3[3] = {0, 120, 240};
static const int CAMERA_BEARINGS_2[2] = {0, 180};

// — State machine —
enum class SystemState { BOOT, CONNECTING, IDLE, RUNNING, ERROR, ESTOP };
static SystemState currentState = SystemState::BOOT;

// — Runtime state —
static WiFiClient wifiClient;
static PubSubClient mqttClient(wifiClient);
static TcMesh mesh;   // shared LoRa mesh: send alerts + receive/relay from other nodes
static unsigned long lastSensorPublish  = 0;
static unsigned long lastReconnectAttempt = 0;
static unsigned long lastLoraAlert      = 0;
static bool eStopRequested              = false;
static float batteryVolts               = 12.0f;
static float solarVolts                 = 0.0f;
static int   detectionCount             = 0;    // alerts sent this session

// — TFLite model (generated from model/predator_model.tflite) —
// If model_data.cc does not exist yet, the build will include this stub.
#if __has_include("model_data.h")
  #include "model_data.h"
  static bool modelAvailable = true;
#else
  static bool modelAvailable = false;
#endif

// ── Forward declarations ─────────────────────────────────────────────────────
void transitionTo(SystemState next);
void handleIdle();
void handleRunning();
void handleError();
void handleEStop();
void reconnectIfNeeded();
void publishSensors();
void publishState(const char* stateStr);
void onMqttMessage(char* topic, uint8_t* payload, unsigned int length);
void broadcastLoraAlert(float confidence);
void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload, uint8_t len, int rssi);
float readBatteryVolts();
float readSolarVolts();
float runInference(uint8_t* frame, size_t frameLen);

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("[WatchTower] Boot");

  esp_task_wdt_init(WATCHDOG_TIMEOUT_MS / 1000, true);
  esp_task_wdt_add(NULL);

  // LoRa mesh init — shared PHY config + addressing/dedup/relay (tc_mesh).
  if (!mesh.begin(LORA_SS, LORA_RST, LORA_DIO0)) {
    Serial.println("[Mesh] LoRa init failed — continuing without mesh");
  } else {
    mesh.onMessage(onMeshMessage);
    Serial.printf("[Mesh] Ready — node 0x%04X, 915 MHz, %d camera(s)\n",
                  mesh.nodeAddr(), CAMERA_COUNT);
  }

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  mqttClient.setServer(MQTT_BROKER, 1883);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setKeepAlive(60);

  transitionTo(SystemState::CONNECTING);
}

// ── Main loop ────────────────────────────────────────────────────────────────
void loop() {
  esp_task_wdt_reset();

  if (eStopRequested) {
    transitionTo(SystemState::ESTOP);
  }

  switch (currentState) {
    case SystemState::CONNECTING:
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("[WiFi] Connected: " + WiFi.localIP().toString());
        transitionTo(SystemState::IDLE);
      }
      break;
    case SystemState::IDLE:    handleIdle();    break;
    case SystemState::RUNNING: handleRunning(); break;
    case SystemState::ERROR:   handleError();   break;
    case SystemState::ESTOP:   handleEStop();   break;
    default: break;
  }

  mqttClient.loop();
  mesh.poll();          // drain LoRa RX: dedup, relay, and fan out remote alerts
  reconnectIfNeeded();

  batteryVolts = readBatteryVolts();
  solarVolts   = readSolarVolts();

  if (batteryVolts < BATTERY_CRITICAL_VOLTS && currentState == SystemState::RUNNING) {
    Serial.println("[Battery] Critical — entering idle to preserve power");
    transitionTo(SystemState::IDLE);
  }
}

// ── State handlers ───────────────────────────────────────────────────────────
void handleIdle() {
  unsigned long now = millis();
  if (now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    publishSensors();
    lastSensorPublish = now;
  }
  // Start patrol if battery sufficient
  if (batteryVolts > BATTERY_LOW_VOLTS) {
    transitionTo(SystemState::RUNNING);
  }
}

void handleRunning() {
  unsigned long now = millis();

  // Publish sensors every 10 s
  if (now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    publishSensors();
    lastSensorPublish = now;
  }

  // Capture and run inference on each installed camera (1..CAMERA_COUNT).
  // Stub: replace with actual camera_capture(i) + model inference per frame.
  float maxConfidence = 0.0f;
  if (modelAvailable) {
    for (int cam = 0; cam < CAMERA_COUNT; cam++) {
      // float c = runInference(frameBuffer[cam], frameLen[cam]);
      // if (c > maxConfidence) maxConfidence = c;
      // Stub returns 0 until real camera integration
    }
  }

  // Threshold: 0.75 confidence = alert
  if (maxConfidence >= 0.75f && (now - lastLoraAlert) >= LORA_BROADCAST_COOLDOWN_MS) {
    Serial.printf("[Inference] Predator detected (confidence=%.2f)\n", maxConfidence);
    broadcastLoraAlert(maxConfidence);
    lastLoraAlert = now;
    detectionCount++;

    // Publish MQTT alert
    JsonDocument doc;
    doc["type"]       = "predator";
    doc["confidence"] = maxConfidence;
    doc["deviceId"]   = DEVICE_ID;
    doc["ts"]         = millis();
    char buf[256];
    serializeJson(doc, buf, sizeof(buf));
    mqttClient.publish("tc/" DEVICE_ID "/alert", buf, 2);
    // Also broadcast to all devices
    mqttClient.publish("tc/broadcast/alert", buf, 2);
  }
}

void handleError() {
  publishState("error");
  delay(2000);  // brief delay then retry idle
  transitionTo(SystemState::IDLE);
}

void handleEStop() {
  // No active outputs on WatchTower (cameras are passive)
  // Cut LoRa transmit power to save battery
  LoRa.sleep();
  publishState("estop");
  // Remain in ESTOP until cleared via MQTT active:false
}

// ── State machine ────────────────────────────────────────────────────────────
void transitionTo(SystemState next) {
  if (next == currentState) return;
  const char* names[] = { "BOOT","CONNECTING","IDLE","RUNNING","ERROR","ESTOP" };
  Serial.printf("[State] %s → %s\n", names[(int)currentState], names[(int)next]);
  currentState = next;
  if (next != SystemState::CONNECTING) {
    publishState(names[(int)next]);
  }
}

// ── MQTT ─────────────────────────────────────────────────────────────────────
void reconnectIfNeeded() {
  if (!mqttClient.connected() && millis() - lastReconnectAttempt > RECONNECT_INTERVAL_MS) {
    lastReconnectAttempt = millis();
    if (mqttClient.connect("watchtower-" DEVICE_ID)) {
      Serial.println("[MQTT] Connected");
      mqttClient.subscribe("tc/" DEVICE_ID "/cmd/estop", 2);
      // Re-publish retained E-STOP clear on reconnect to check current state
    } else {
      Serial.printf("[MQTT] Connect failed, rc=%d\n", mqttClient.state());
    }
  }
}

void onMqttMessage(char* topic, uint8_t* payload, unsigned int length) {
  // All payloads MUST be valid JSON strings — reject non-JSON silently
  char buf[512];
  size_t copyLen = min((unsigned int)sizeof(buf) - 1, length);
  memcpy(buf, payload, copyLen);
  buf[copyLen] = '\0';

  JsonDocument doc;
  if (deserializeJson(doc, buf) != DeserializationError::Ok) {
    Serial.printf("[MQTT] Invalid JSON on topic %s\n", topic);
    return;
  }

  // E-STOP handler — always processed first
  if (strstr(topic, "/cmd/estop")) {
    bool active = doc["active"] | false;
    eStopRequested = active;
    if (!active && currentState == SystemState::ESTOP) {
      LoRa.idle();
      transitionTo(SystemState::IDLE);
    }
  }
}

// ── Sensor publishing ─────────────────────────────────────────────────────────
void publishSensors() {
  if (!mqttClient.connected()) return;
  // Average battery reads over 3 samples
  float bv = 0;
  for (int i = 0; i < 3; i++) { bv += readBatteryVolts(); delay(5); }
  bv /= 3.0f;

  JsonDocument doc;
  doc["deviceId"]       = DEVICE_ID;
  doc["batteryVolts"]   = bv;
  doc["solarVolts"]     = solarVolts;
  doc["batteryPct"]     = constrain((int)((bv - BATTERY_CRITICAL_VOLTS) / (12.6f - BATTERY_CRITICAL_VOLTS) * 100), 0, 100);
  doc["state"]          = currentState == SystemState::ESTOP ? "estop" :
                          currentState == SystemState::RUNNING ? "running" : "idle";
  doc["modelAvailable"] = modelAvailable;
  doc["detectionCount"] = detectionCount;
  doc["cameraCount"]    = CAMERA_COUNT;
  doc["meshNode"]       = mesh.nodeAddr();
  doc["meshRelayed"]    = mesh.relayed();
  doc["ts"]             = millis();

  char buf[512];
  serializeJson(doc, buf, sizeof(buf));
  mqttClient.publish("tc/" DEVICE_ID "/sensors", buf, false);  // QoS 0
}

void publishState(const char* stateStr) {
  if (!mqttClient.connected()) return;
  JsonDocument doc;
  doc["state"]    = stateStr;
  doc["deviceId"] = DEVICE_ID;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"]   = millis() / 1000;
  doc["rssi"]     = WiFi.RSSI();
  doc["ts"]       = millis();
  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  // PubSubClient publishes QoS 0 only (no QoS arg). retained=false.
  mqttClient.publish("tc/" DEVICE_ID "/state", (const uint8_t*)buf, (unsigned int)n, false);
}

// ── LoRa mesh broadcast ──────────────────────────────────────────────────────
// Flood the alert across the mesh (TTL + dedup handled by tc_mesh). Every node
// — coop relay, other WatchTowers, the MQTT bridge — gets it and relays it on,
// so a far-fence detection still reaches the broker even with no direct link.
void broadcastLoraAlert(float confidence) {
  if (!mesh.ready()) return;
  JsonDocument doc;
  doc["type"]       = "predator";
  doc["confidence"] = confidence;
  doc["src"]        = DEVICE_ID;
  doc["ts"]         = millis();
  char buf[TC_MESH_MAX_PAYLOAD];
  serializeJson(doc, buf, sizeof(buf));

  uint16_t id = mesh.sendBroadcast(TC_MSG_ALERT, buf);
  Serial.printf("[Mesh] Alert broadcast (msgId=%u): %s\n", id, buf);
}

// ── LoRa mesh receive: bridge remote alerts to the cloud ─────────────────────
// A node that can reach the broker forwards any mesh alert it hears onto MQTT
// tc/broadcast/alert so the app sees detections from radios it can't hear
// directly. ESTOP from the mesh fans out locally (cut into our own state).
void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload,
                   uint8_t len, int rssi) {
  switch (type) {
    case TC_MSG_ALERT: {
      Serial.printf("[Mesh] Alert from 0x%04X (rssi=%d): %.*s\n",
                    src, rssi, len, (const char*)payload);
      if (mqttClient.connected()) {
        // Re-publish verbatim; payload is already the alert JSON.
        mqttClient.publish("tc/broadcast/alert", payload, len, false);
      }
      break;
    }
    case TC_MSG_ESTOP:
      Serial.printf("[Mesh] ESTOP from 0x%04X — entering ESTOP\n", src);
      eStopRequested = true;
      break;
    case TC_MSG_PING:
      Serial.printf("[Mesh] Ping from 0x%04X (rssi=%d)\n", src, rssi);
      break;
    default:
      break;
  }
}

// ── ADC helpers ──────────────────────────────────────────────────────────────
float readBatteryVolts() {
  // 11.1V 3S pack → voltage divider R1=100k R2=10k → scale factor ~12.1
  int raw = analogRead(BATTERY_ADC);
  return (raw / 4095.0f) * 3.3f * 12.1f;
}

float readSolarVolts() {
  // 6V solar panel → voltage divider R1=47k R2=10k → scale factor ~5.7
  int raw = analogRead(SOLAR_ADC);
  return (raw / 4095.0f) * 3.3f * 5.7f;
}

// ── TFLite inference stub ────────────────────────────────────────────────────
float runInference(uint8_t* frame, size_t frameLen) {
  // TODO: Wire up TFLite Micro interpreter with g_predator_model_data
  // Steps:
  //   1. tflite::MicroInterpreter interpreter(model, ops, tensor_arena, arena_size)
  //   2. interpreter.AllocateTensors()
  //   3. Copy frame into input tensor (resize to 96×96 RGB)
  //   4. interpreter.Invoke()
  //   5. Return output tensor[0] (predator confidence 0.0-1.0)
  (void)frame; (void)frameLen;
  return 0.0f;
}
