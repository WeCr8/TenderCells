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

// — State machine —
enum class SystemState { BOOT, CONNECTING, IDLE, RUNNING, ERROR, ESTOP };
static SystemState currentState = SystemState::BOOT;

// — Runtime state —
static WiFiClient wifiClient;
static PubSubClient mqttClient(wifiClient);
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
float readBatteryVolts();
float readSolarVolts();
float runInference(uint8_t* frame, size_t frameLen);

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("[WatchTower] Boot");

  esp_task_wdt_init(WATCHDOG_TIMEOUT_MS / 1000, true);
  esp_task_wdt_add(NULL);

  // LoRa init
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(915E6)) {
    Serial.println("[LoRa] Init failed — continuing without LoRa");
  } else {
    LoRa.setTxPower(20);
    LoRa.setSpreadingFactor(9);
    Serial.println("[LoRa] Ready 915 MHz");
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

  // Capture and run inference on all 3 cameras
  // Stub: replace with actual camera_capture() + model inference per frame
  float maxConfidence = 0.0f;
  if (modelAvailable) {
    // maxConfidence = runInference(frameBuffer, frameLen);
    // Stub returns 0 until real camera integration
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
  serializeJson(doc, buf, sizeof(buf));
  mqttClient.publish("tc/" DEVICE_ID "/state", buf, 1, false);
}

// ── LoRa broadcast ───────────────────────────────────────────────────────────
void broadcastLoraAlert(float confidence) {
  // JSON payload over LoRa — all devices on the mesh receive this
  JsonDocument doc;
  doc["type"]       = "predator";
  doc["confidence"] = confidence;
  doc["src"]        = DEVICE_ID;
  doc["ts"]         = millis();
  char buf[128];
  serializeJson(doc, buf, sizeof(buf));

  LoRa.beginPacket();
  LoRa.print(buf);
  LoRa.endPacket();
  Serial.printf("[LoRa] Broadcast: %s\n", buf);
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
