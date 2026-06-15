// Tender Cells — Chicken Tender (Coop Controller)
// ESP32-WROOM-32 firmware
// Controls: sensors, MQTT, door servo, feed dispenser, cleaning cycle, E-STOP authority.
//
// Hardware split (see CLAUDE.md §1.5): this ESP32 owns the coop's local actuators
// (door, feed, cleaning scraper) and is the E-STOP authority. The 9DOF arm/gantry is
// driven by the Jetson Nano — this board does NOT move the arm; it enforces the
// chicken-presence safety veto and E-STOP for it, then lets the Jetson act.
//
// Provisioning: WiFi + broker config are entered once via a captive-portal setup AP
// (no credentials are compiled in — see provisionConfig()). Stored in NVS.
//
// Last updated: 2026-06-15

#include <WiFi.h>
#include <WiFiManager.h>      // tzapu/WiFiManager — captive-portal provisioning
#include <Preferences.h>      // NVS storage for broker IP + device id
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>       // madhephaestus/ESP32Servo — door servo
#include <DHT.h>
#include "esp_task_wdt.h"

// ============================================================================
// CONFIGURATION
// ============================================================================

// Runtime config — loaded from NVS / captive portal, never hardcoded.
char MQTT_BROKER[40]    = "192.168.1.100";   // default, overridden by provisioning
char MQTT_DEVICE_ID[32] = "chicken_tender_001";
int  MQTT_PORT          = 1883;
const char* MQTT_USER = NULL;
const char* MQTT_PASS = NULL;

Preferences prefs;

// Timings (milliseconds)
const unsigned long WATCHDOG_TIMEOUT_MS       = 8000;
const unsigned long SENSOR_PUBLISH_INTERVAL_MS = 10000;
const unsigned long STATE_PUBLISH_INTERVAL_MS  = 10000;
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 30000;
const unsigned long CLEANING_CYCLE_MAX_MS      = 300000;  // 5 min hard cap
const unsigned long FEED_MS_PER_GRAM           = 30;      // dispenser calibration

// Pins (ESP32 GPIO)
#define PIN_DHT_TEMP        4
#define PIN_AMMONIA_SENSOR  35     // ADC1_7
#define PIN_DOOR_SERVO      13
#define PIN_STEPPER_ENABLE  12     // cleaning scraper stepper, active-LOW enable
#define PIN_STEPPER_STEP    14
#define PIN_STEPPER_DIR     27
#define PIN_FEED_MOTOR_PWM  26
#define PIN_FEED_MOTOR_DIR  25

#define DOOR_OPEN_DEG   90
#define DOOR_CLOSE_DEG  0

// ============================================================================
// STATE MACHINE
// ============================================================================

enum class SystemState { BOOT, CONNECTING, IDLE, RUNNING, ERROR, ESTOP };

SystemState currentState  = SystemState::BOOT;
SystemState previousState = SystemState::BOOT;
unsigned long lastStateChangeMs = 0;

// E-STOP is authoritative: when set, no actuator may move until cleared by the app.
volatile bool eStopActive = false;

// Non-blocking action timers (loop never blocks > a few ms)
bool feedActive = false;       unsigned long feedEndMs = 0;
bool cleaningActive = false;   unsigned long cleaningEndMs = 0;

// ============================================================================
// WATCHDOG & TIMING
// ============================================================================

unsigned long lastSensorPublishMs        = 0;
unsigned long lastStatePublishMs         = 0;
unsigned long lastMqttReconnectAttemptMs = 0;
unsigned long lastWifiReconnectAttemptMs = 0;

// ============================================================================
// MQTT, WiFi, SERVO, SENSORS
// ============================================================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Servo doorServo;
DHT dht(PIN_DHT_TEMP, DHT22);

struct SensorReading {
  float temperature;
  float humidity;
  float ammonia;
  float feedLevel;
  float waterLevel;
  int chickenCount;
  const char* doorState;
  unsigned long timestamp;
};

SensorReading currentReading = {0, 0, 0, 0, 0, 0, "unknown", 0};
const char* g_doorState = "closed";   // last commanded door position

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================

void transitionTo(SystemState nextState);
void handleConnecting();
void handleIdle();
void handleRunning();
void handleError();
void handleEStop();
void provisionConfig();
void reconnectWiFiIfNeeded();
void reconnectMqttIfNeeded();
void subscribeCommands();
void publishSensorData();
void publishState();
void readSensors();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
void disableAllMotors();
void setDoor(bool open);
void startFeed(float grams);
void startCleaning();
void stopCleaning();
void enterEStop();
void clearEStop();
const char* stateName(SystemState s);

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n=== CHICKEN TENDER BOOTING ===");

  // GPIO — steppers/feed disabled by default (no idle energizing).
  pinMode(PIN_STEPPER_ENABLE, OUTPUT);
  pinMode(PIN_STEPPER_STEP, OUTPUT);
  pinMode(PIN_STEPPER_DIR, OUTPUT);
  pinMode(PIN_FEED_MOTOR_PWM, OUTPUT);
  pinMode(PIN_FEED_MOTOR_DIR, OUTPUT);
  disableAllMotors();

  // Door servo
  doorServo.setPeriodHertz(50);
  doorServo.attach(PIN_DOOR_SERVO, 500, 2400);
  doorServo.write(DOOR_CLOSE_DEG);
  g_doorState = "closed";

  dht.begin();
  Serial.println("✓ Sensors initialized");

  // Load config + WiFi via captive portal. This BLOCKS until the user finishes
  // setup — far longer than the 8s watchdog — so the watchdog must NOT be armed
  // yet, or the board panic-reboots mid-portal and the setup AP never stays up.
  provisionConfig();

  // Safe to arm the watchdog now that the blocking portal is done.
  esp_task_wdt_init(WATCHDOG_TIMEOUT_MS / 1000, true);
  esp_task_wdt_add(NULL);
  Serial.println("✓ Watchdog initialized (8s timeout)");

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(512);
  // Socket timeout MUST stay below the 8s watchdog. PubSubClient defaults to 15s,
  // so a wrong/unreachable broker IP would block connect() long enough to trip the
  // watchdog and reboot-loop the board forever. 4s fails fast and lets loop() retry.
  mqttClient.setSocketTimeout(4);
  Serial.printf("✓ MQTT target %s:%d  device=%s\n", MQTT_BROKER, MQTT_PORT, MQTT_DEVICE_ID);

  transitionTo(SystemState::CONNECTING);
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  esp_task_wdt_reset();  // CRITICAL: feed watchdog every iteration

  // E-STOP wins, always, regardless of state.
  if (eStopActive && currentState != SystemState::ESTOP) {
    transitionTo(SystemState::ESTOP);
  }

  switch (currentState) {
    case SystemState::CONNECTING: handleConnecting(); break;
    case SystemState::IDLE:       handleIdle();       break;
    case SystemState::RUNNING:    handleRunning();    break;
    case SystemState::ERROR:      handleError();      break;
    case SystemState::ESTOP:      handleEStop();      break;
    default: transitionTo(SystemState::CONNECTING);   break;
  }

  if (mqttClient.connected()) mqttClient.loop();
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

void handleConnecting() {
  reconnectWiFiIfNeeded();
  reconnectMqttIfNeeded();
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    transitionTo(SystemState::IDLE);
  }
}

void handleIdle() {
  unsigned long now = millis();

  if (now - lastSensorPublishMs > SENSOR_PUBLISH_INTERVAL_MS) {
    readSensors();
    publishSensorData();
    lastSensorPublishMs = now;
  }
  if (now - lastStatePublishMs > STATE_PUBLISH_INTERVAL_MS) {
    publishState();
    lastStatePublishMs = now;
  }
  if (WiFi.status() != WL_CONNECTED || !mqttClient.connected()) {
    transitionTo(SystemState::CONNECTING);
  }
}

void handleRunning() {
  unsigned long now = millis();

  // Feed dispense — timed, non-blocking.
  if (feedActive && now >= feedEndMs) {
    digitalWrite(PIN_FEED_MOTOR_PWM, LOW);
    feedActive = false;
    Serial.println("✓ Feed complete");
  }

  // Cleaning cycle — timed, non-blocking, hard-capped.
  if (cleaningActive && now >= cleaningEndMs) {
    stopCleaning();
    Serial.println("✓ Cleaning complete (cap reached)");
  }

  // Keep telemetry flowing while running.
  if (now - lastSensorPublishMs > SENSOR_PUBLISH_INTERVAL_MS) {
    readSensors();
    publishSensorData();
    lastSensorPublishMs = now;
  }

  if (!feedActive && !cleaningActive) {
    transitionTo(SystemState::IDLE);
  }
  if (WiFi.status() != WL_CONNECTED || !mqttClient.connected()) {
    transitionTo(SystemState::CONNECTING);
  }
}

void handleError() {
  disableAllMotors();
  reconnectWiFiIfNeeded();
  reconnectMqttIfNeeded();
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    transitionTo(SystemState::IDLE);
  }
}

void handleEStop() {
  // All actuators dead. Door is left where it is (no surprise motion).
  disableAllMotors();
  feedActive = false;
  cleaningActive = false;
  // State is republished (retained) on entry via transitionTo/enterEStop.
  // Stays here until the app publishes estop {active:false}.
}

// ============================================================================
// STATE MACHINE UTILITIES
// ============================================================================

const char* stateName(SystemState s) {
  switch (s) {
    case SystemState::BOOT:       return "boot";
    case SystemState::CONNECTING: return "connecting";
    case SystemState::IDLE:       return "idle";
    case SystemState::RUNNING:    return "running";
    case SystemState::ERROR:      return "error";
    case SystemState::ESTOP:      return "estop";
  }
  return "unknown";
}

void transitionTo(SystemState nextState) {
  if (nextState == currentState) return;
  previousState = currentState;
  currentState = nextState;
  lastStateChangeMs = millis();
  Serial.printf("[STATE] %s → %s\n", stateName(previousState), stateName(currentState));
  publishState();
}

// ============================================================================
// PROVISIONING (captive portal, no hardcoded credentials)
// ============================================================================

void provisionConfig() {
  prefs.begin("tc", false);
  prefs.getString("broker", MQTT_BROKER, sizeof(MQTT_BROKER));
  prefs.getString("devid", MQTT_DEVICE_ID, sizeof(MQTT_DEVICE_ID));
  MQTT_PORT = prefs.getInt("port", MQTT_PORT);

  WiFiManager wm;
  wm.setConfigPortalTimeout(180);  // 3 min, then reboot and retry

  // Extra fields so a phone can set the broker without reflashing.
  WiFiManagerParameter pBroker("broker", "MQTT broker IP", MQTT_BROKER, sizeof(MQTT_BROKER));
  WiFiManagerParameter pPort("port", "MQTT port", String(MQTT_PORT).c_str(), 6);
  WiFiManagerParameter pDev("devid", "Device ID", MQTT_DEVICE_ID, sizeof(MQTT_DEVICE_ID));
  wm.addParameter(&pBroker);
  wm.addParameter(&pPort);
  wm.addParameter(&pDev);

  // Opens AP "ChickenTender-Setup" only if no saved WiFi; otherwise auto-connects.
  if (!wm.autoConnect("ChickenTender-Setup")) {
    Serial.println("❌ Provisioning timed out — rebooting");
    delay(1000);
    ESP.restart();
  }

  // Persist any values the user entered in the portal.
  strncpy(MQTT_BROKER, pBroker.getValue(), sizeof(MQTT_BROKER));
  strncpy(MQTT_DEVICE_ID, pDev.getValue(), sizeof(MQTT_DEVICE_ID));
  MQTT_PORT = atoi(pPort.getValue());
  prefs.putString("broker", MQTT_BROKER);
  prefs.putString("devid", MQTT_DEVICE_ID);
  prefs.putInt("port", MQTT_PORT);
  Serial.printf("✓ WiFi connected, IP %s\n", WiFi.localIP().toString().c_str());
}

// ============================================================================
// WIFI & MQTT
// ============================================================================

void reconnectWiFiIfNeeded() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long now = millis();
  if (now - lastWifiReconnectAttemptMs < WIFI_RECONNECT_INTERVAL_MS) return;
  lastWifiReconnectAttemptMs = now;
  Serial.print(".");
  WiFi.reconnect();
}

void subscribeCommands() {
  char t[64];
  snprintf(t, sizeof(t), "tc/%s/cmd/estop", MQTT_DEVICE_ID); mqttClient.subscribe(t, 2);  // QoS 2
  snprintf(t, sizeof(t), "tc/%s/cmd/door",  MQTT_DEVICE_ID); mqttClient.subscribe(t, 1);
  snprintf(t, sizeof(t), "tc/%s/cmd/feed",  MQTT_DEVICE_ID); mqttClient.subscribe(t, 1);
  snprintf(t, sizeof(t), "tc/%s/cmd/clean", MQTT_DEVICE_ID); mqttClient.subscribe(t, 1);
  snprintf(t, sizeof(t), "tc/%s/cmd/arm",   MQTT_DEVICE_ID); mqttClient.subscribe(t, 1);
}

void reconnectMqttIfNeeded() {
  if (mqttClient.connected()) return;
  unsigned long now = millis();
  if (now - lastMqttReconnectAttemptMs < MQTT_RECONNECT_INTERVAL_MS) return;
  lastMqttReconnectAttemptMs = now;

  String clientId = String(MQTT_DEVICE_ID) + "_" + String(random(0xffff), HEX);
  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
    Serial.println("✓ MQTT connected");
    subscribeCommands();
    publishState();
  } else {
    Serial.printf("❌ MQTT connect failed, rc=%d\n", mqttClient.state());
  }
}

// ============================================================================
// MQTT COMMAND HANDLER  (parses tc/{id}/cmd/* and acts)
// ============================================================================

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, payload, length)) {
    Serial.println("❌ Bad JSON command — ignored");
    return;
  }

  // Last path segment = action.
  const char* action = strrchr(topic, '/');
  action = action ? action + 1 : topic;

  // --- E-STOP first, always (safety authority) ---
  if (strcmp(action, "estop") == 0) {
    bool active = doc["active"] | false;
    if (active) enterEStop();
    else        clearEStop();
    return;
  }

  // While E-STOP is latched, refuse every other command.
  if (eStopActive) {
    Serial.printf("⛔ %s ignored — E-STOP active\n", action);
    return;
  }

  if (strcmp(action, "door") == 0) {
    const char* st = doc["state"] | "";
    if (strcmp(st, "open") == 0)       setDoor(true);
    else if (strcmp(st, "close") == 0) setDoor(false);
    publishState();

  } else if (strcmp(action, "feed") == 0) {
    float grams = doc["amount"] | 0.0f;
    if (grams > 0) startFeed(grams);

  } else if (strcmp(action, "clean") == 0) {
    const char* act = doc["action"] | "";
    if (strcmp(act, "start") == 0)     startCleaning();
    else if (strcmp(act, "stop") == 0) stopCleaning();

  } else if (strcmp(action, "arm") == 0) {
    // Arm/gantry is driven by the Jetson. This board enforces the safety veto:
    // NEVER allow arm motion while a chicken is present (CLAUDE.md non-negotiable).
    if (currentReading.chickenCount > 0) {
      Serial.println("⛔ ARM vetoed — chicken present");
      char t[64]; snprintf(t, sizeof(t), "tc/%s/alert", MQTT_DEVICE_ID);
      char b[96];
      snprintf(b, sizeof(b),
        "{\"type\":\"safety\",\"message\":\"arm motion vetoed: chicken present\",\"ts\":%lu}",
        millis());
      mqttClient.publish(t, b, false);
    } else {
      Serial.println("✓ ARM ok — clear of chickens (Jetson executes)");
    }
  }
}

// ============================================================================
// ACTUATORS  (every one gated by eStopActive at the call site)
// ============================================================================

void setDoor(bool open) {
  if (eStopActive) return;
  doorServo.write(open ? DOOR_OPEN_DEG : DOOR_CLOSE_DEG);
  g_doorState = open ? "open" : "closed";
  Serial.printf("\U0001f6aa door → %s\n", g_doorState);
}

void startFeed(float grams) {
  if (eStopActive) return;
  digitalWrite(PIN_FEED_MOTOR_DIR, HIGH);
  digitalWrite(PIN_FEED_MOTOR_PWM, HIGH);
  feedEndMs = millis() + (unsigned long)(grams * FEED_MS_PER_GRAM);
  feedActive = true;
  Serial.printf("\U0001f33e feed %.0fg\n", grams);
  transitionTo(SystemState::RUNNING);
}

void startCleaning() {
  if (eStopActive) return;
  digitalWrite(PIN_STEPPER_ENABLE, LOW);   // enable (active-LOW)
  cleaningEndMs = millis() + CLEANING_CYCLE_MAX_MS;
  cleaningActive = true;
  Serial.println("\U0001f9f9 cleaning start");
  transitionTo(SystemState::RUNNING);
}

void stopCleaning() {
  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable — never leave stepper energized
  cleaningActive = false;
  Serial.println("\U0001f9f9 cleaning stop");
}

void disableAllMotors() {
  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable stepper (active-LOW enable)
  digitalWrite(PIN_FEED_MOTOR_PWM, LOW);   // stop feed motor
}

void enterEStop() {
  eStopActive = true;
  disableAllMotors();
  feedActive = false;
  cleaningActive = false;
  transitionTo(SystemState::ESTOP);
  Serial.println("\U0001f6d1 E-STOP ENGAGED");
}

void clearEStop() {
  eStopActive = false;
  Serial.println("✅ E-STOP cleared");
  transitionTo(SystemState::IDLE);
}

// ============================================================================
// SENSOR READING & PUBLISHING
// ============================================================================

void readSensors() {
  // Average 3 samples (CLAUDE.md convention) for temp/humidity/ammonia.
  float tSum = 0, hSum = 0, aSum = 0; int n = 0;
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature(true);   // Fahrenheit
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) { tSum += t; hSum += h; n++; }
    aSum += (analogRead(PIN_AMMONIA_SENSOR) / 4095.0) * 100.0;
    delay(20);  // < 50ms, watchdog-safe
  }

  if (n == 0) {
    Serial.println("❌ DHT22 read failed");
    transitionTo(SystemState::ERROR);
    return;
  }

  currentReading.temperature = tSum / n;
  currentReading.humidity    = hSum / n;
  currentReading.ammonia     = aSum / 3.0;
  currentReading.feedLevel   = 50.0;   // TODO: HX711 load cell
  currentReading.waterLevel  = 75.0;   // TODO: level sensor
  currentReading.chickenCount = 3;     // TODO: IR/vision headcount (drives arm veto)
  currentReading.doorState   = g_doorState;
  currentReading.timestamp   = millis();
}

void publishSensorData() {
  if (!mqttClient.connected()) return;
  char topic[64];
  snprintf(topic, sizeof(topic), "tc/%s/sensors", MQTT_DEVICE_ID);

  StaticJsonDocument<512> doc;
  doc["temp"]         = currentReading.temperature;
  doc["humidity"]     = currentReading.humidity;
  doc["ammonia"]      = currentReading.ammonia;
  doc["feedLevel"]    = currentReading.feedLevel;
  doc["waterLevel"]   = currentReading.waterLevel;
  doc["chickenCount"] = currentReading.chickenCount;
  doc["doorState"]    = currentReading.doorState;
  doc["ts"]           = currentReading.timestamp;

  char buf[512];
  size_t n = serializeJson(doc, buf);
  mqttClient.publish(topic, (const uint8_t*)buf, n, false);  // QoS 0 telemetry
}

void publishState() {
  if (!mqttClient.connected()) return;
  char topic[64];
  snprintf(topic, sizeof(topic), "tc/%s/state", MQTT_DEVICE_ID);

  StaticJsonDocument<256> doc;
  doc["state"]     = stateName(currentState);
  doc["doorState"] = g_doorState;
  doc["uptime"]    = millis() / 1000;
  doc["freeHeap"]  = ESP.getFreeHeap();
  doc["rssi"]      = WiFi.RSSI();
  doc["ts"]        = millis();

  char buf[256];
  size_t n = serializeJson(doc, buf);
  // E-STOP state is retained so a late-joining subscriber sees the active stop.
  bool retain = (currentState == SystemState::ESTOP);
  mqttClient.publish(topic, (const uint8_t*)buf, n, retain);
}
