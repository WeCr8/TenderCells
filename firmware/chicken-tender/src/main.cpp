// Tender Cells — Chicken Tender (Coop Controller)
// ESP32-WROOM-32 firmware
// Controls: sensors, MQTT, door, feed, cleaning arm coordination
// Last updated: 2026-06-11

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "esp_task_wdt.h"

// ============================================================================
// CONFIGURATION
// ============================================================================

// WiFi credentials (load from NVS in production, not hardcoded)
const char* WIFI_SSID = "";           // TODO: Set via OTA or NVS
const char* WIFI_PASSWORD = "";       // TODO: Set via OTA or NVS

// MQTT broker
const char* MQTT_BROKER = "192.168.1.100";
const int MQTT_PORT = 1883;
const char* MQTT_DEVICE_ID = "chicken_tender_001";
const char* MQTT_USER = NULL;
const char* MQTT_PASS = NULL;

// Timings (milliseconds)
const unsigned long WATCHDOG_TIMEOUT_MS = 8000;
const unsigned long SENSOR_PUBLISH_INTERVAL_MS = 10000;
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 30000;

// Pins (ESP32 GPIO)
#define PIN_DHT_TEMP 4
#define PIN_AMMONIA_SENSOR 35      // ADC1_7
#define PIN_DOOR_SERVO 13
#define PIN_STEPPER_ENABLE 12
#define PIN_STEPPER_STEP 14
#define PIN_STEPPER_DIR 27
#define PIN_FEED_MOTOR_PWM 26
#define PIN_FEED_MOTOR_DIR 25

// ============================================================================
// STATE MACHINE
// ============================================================================

enum class SystemState {
  BOOT,
  CONNECTING,
  IDLE,
  RUNNING,
  ERROR,
  ESTOP
};

SystemState currentState = SystemState::BOOT;
SystemState previousState = SystemState::BOOT;
unsigned long lastStateChangeMs = 0;

// ============================================================================
// WATCHDOG & TIMING
// ============================================================================

unsigned long lastWatchdogResetMs = 0;
unsigned long lastSensorPublishMs = 0;
unsigned long lastMqttReconnectAttemptMs = 0;
unsigned long lastWifiReconnectAttemptMs = 0;

// ============================================================================
// MQTT & WiFi
// ============================================================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============================================================================
// SENSORS
// ============================================================================

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

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================

void transitionTo(SystemState nextState);
void handleBoot();
void handleConnecting();
void handleIdle();
void handleRunning();
void handleError();
void handleEStop();
void resetWatchdog();
void setupWiFi();
void setupMqtt();
void reconnectWiFiIfNeeded();
void reconnectMqttIfNeeded();
void publishSensorData();
void readSensors();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
void disableAllMotors();

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n\n=== CHICKEN TENDER BOOTING ===");
  Serial.printf("Device ID: %s\n", MQTT_DEVICE_ID);

  // Initialize watchdog timer — ESP-IDF 4.x API (timeout in seconds, panic on overflow)
  esp_task_wdt_init(WATCHDOG_TIMEOUT_MS / 1000, true);
  esp_task_wdt_add(NULL);
  Serial.println("✓ Watchdog initialized (8s timeout)");

  // Initialize pins
  pinMode(PIN_DOOR_SERVO, OUTPUT);
  pinMode(PIN_STEPPER_ENABLE, OUTPUT);
  pinMode(PIN_STEPPER_STEP, OUTPUT);
  pinMode(PIN_STEPPER_DIR, OUTPUT);
  pinMode(PIN_FEED_MOTOR_PWM, OUTPUT);
  pinMode(PIN_FEED_MOTOR_DIR, OUTPUT);
  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // Steppers disabled by default
  Serial.println("✓ GPIO pins initialized");

  // Initialize sensors
  dht.begin();
  Serial.println("✓ DHT22 sensor initialized");

  // Initialize MQTT client
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(512);
  Serial.println("✓ MQTT client configured");

  // Transition to CONNECTING
  transitionTo(SystemState::CONNECTING);
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // CRITICAL: Reset watchdog every iteration
  resetWatchdog();

  // Handle current state
  switch (currentState) {
    case SystemState::BOOT:
      handleBoot();
      break;
    case SystemState::CONNECTING:
      handleConnecting();
      break;
    case SystemState::IDLE:
      handleIdle();
      break;
    case SystemState::RUNNING:
      handleRunning();
      break;
    case SystemState::ERROR:
      handleError();
      break;
    case SystemState::ESTOP:
      handleEStop();
      break;
    default:
      transitionTo(SystemState::ERROR);
      break;
  }

  // Keep MQTT connection alive
  if (mqttClient.connected()) {
    mqttClient.loop();
  }
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

void handleBoot() {
  // Initialization in setup() — immediately move to CONNECTING
  transitionTo(SystemState::CONNECTING);
}

void handleConnecting() {
  // Attempt WiFi + MQTT connection
  reconnectWiFiIfNeeded();
  reconnectMqttIfNeeded();

  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    transitionTo(SystemState::IDLE);
  }
}

void handleIdle() {
  // All actuators off, sensors polling
  // Ready to receive commands

  // Publish sensor data periodically
  if (millis() - lastSensorPublishMs > SENSOR_PUBLISH_INTERVAL_MS) {
    readSensors();
    publishSensorData();
    lastSensorPublishMs = millis();
  }

  // Check if WiFi/MQTT lost
  if (WiFi.status() != WL_CONNECTED || !mqttClient.connected()) {
    transitionTo(SystemState::CONNECTING);
  }
}

void handleRunning() {
  // Device actively executing command (arm motion, cleaning, etc.)
  // TODO: Implement specific running logic based on command type

  // For now, just monitor and return to IDLE
  delay(100);  // Brief pause to avoid hammering loop
  transitionTo(SystemState::IDLE);
}

void handleError() {
  // System in error state — attempt recovery
  Serial.println("⚠️  ERROR state — attempting recovery");

  // Disable all motors
  disableAllMotors();

  // Attempt to re-establish connection
  reconnectWiFiIfNeeded();
  reconnectMqttIfNeeded();

  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    transitionTo(SystemState::IDLE);
  }
}

void handleEStop() {
  // EMERGENCY STOP — all power cut immediately
  disableAllMotors();

  // Publish E-STOP status
  char topic[64];
  snprintf(topic, sizeof(topic), "tc/%s/state", MQTT_DEVICE_ID);

  DynamicJsonDocument doc(256);
  doc["state"] = "estop";
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);

  mqttClient.publish(topic, buffer, true);  // retained

  // Stay in E-STOP until manual clear
  // (app must send estop: false to exit)
}

// ============================================================================
// STATE MACHINE UTILITIES
// ============================================================================

void transitionTo(SystemState nextState) {
  if (nextState != currentState) {
    previousState = currentState;
    currentState = nextState;
    lastStateChangeMs = millis();

    // Log state transition
    const char* stateNames[] = {"BOOT", "CONNECTING", "IDLE", "RUNNING", "ERROR", "ESTOP"};
    Serial.printf("[STATE] %s → %s\n",
      stateNames[(int)previousState],
      stateNames[(int)currentState]);

    // Publish to Firebase (TODO: implement via MQTT bridge)
  }
}

void resetWatchdog() {
  esp_task_wdt_reset();
}

// ============================================================================
// WIFI & MQTT
// ============================================================================

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Non-blocking WiFi connection (handled in reconnectWiFiIfNeeded)
}

void reconnectWiFiIfNeeded() {
  if (WiFi.status() == WL_CONNECTED) {
    return;  // Already connected
  }

  unsigned long now = millis();
  if (now - lastWifiReconnectAttemptMs < WIFI_RECONNECT_INTERVAL_MS) {
    return;  // Not yet time to retry
  }

  lastWifiReconnectAttemptMs = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    WiFi.reconnect();
  }
}

void setupMqtt() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void reconnectMqttIfNeeded() {
  if (mqttClient.connected()) {
    return;  // Already connected
  }

  unsigned long now = millis();
  if (now - lastMqttReconnectAttemptMs < MQTT_RECONNECT_INTERVAL_MS) {
    return;  // Not yet time to retry
  }

  lastMqttReconnectAttemptMs = now;

  Serial.print("Attempting MQTT connection to ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  String clientId = String(MQTT_DEVICE_ID) + "_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
    Serial.println("✓ MQTT connected");

    // Subscribe to control topics
    char estopTopic[64];
    snprintf(estopTopic, sizeof(estopTopic), "tc/%s/cmd/estop", MQTT_DEVICE_ID);
    mqttClient.subscribe(estopTopic, 2);  // QoS 2

    char armTopic[64];
    snprintf(armTopic, sizeof(armTopic), "tc/%s/cmd/arm", MQTT_DEVICE_ID);
    mqttClient.subscribe(armTopic, 1);  // QoS 1
  } else {
    Serial.print("❌ MQTT connection failed, rc=");
    Serial.println(mqttClient.state());
  }
}

// ============================================================================
// MQTT MESSAGE HANDLER
// ============================================================================

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.printf("MQTT message received on topic: %s\n", topic);

  // TODO: Parse commands and update state accordingly
  // E-STOP: {"active": true}
  // ARM: {"seq": 42, "joints": [0,45,90,0,45,0], "speed": 0.3}
}

// ============================================================================
// SENSOR READING & PUBLISHING
// ============================================================================

void readSensors() {
  // Temperature + Humidity
  currentReading.temperature = dht.readTemperature(false);  // Fahrenheit
  currentReading.humidity = dht.readHumidity();

  if (isnan(currentReading.temperature) || isnan(currentReading.humidity)) {
    Serial.println("❌ DHT22 read failed");
    transitionTo(SystemState::ERROR);
    return;
  }

  // Ammonia (MQ-137) — analog read, 0-4095 → 0-100 ppm (calibration needed)
  int rawAmmonia = analogRead(PIN_AMMONIA_SENSOR);
  currentReading.ammonia = (rawAmmonia / 4095.0) * 100.0;

  // Feed level (load cell) — TODO: implement HX711 ADC
  currentReading.feedLevel = 50.0;  // Placeholder

  // Water level — TODO: implement level sensor
  currentReading.waterLevel = 75.0;  // Placeholder

  // Chicken count — TODO: implement vision or IR sensor
  currentReading.chickenCount = 3;  // Placeholder

  // Door state — TODO: implement reed switch
  currentReading.doorState = "closed";  // Placeholder

  currentReading.timestamp = millis();
}

void publishSensorData() {
  char topic[64];
  snprintf(topic, sizeof(topic), "tc/%s/sensors", MQTT_DEVICE_ID);

  DynamicJsonDocument doc(512);
  doc["temp"] = currentReading.temperature;
  doc["humidity"] = currentReading.humidity;
  doc["ammonia"] = currentReading.ammonia;
  doc["feedLevel"] = currentReading.feedLevel;
  doc["waterLevel"] = currentReading.waterLevel;
  doc["chickenCount"] = currentReading.chickenCount;
  doc["doorState"] = currentReading.doorState;
  doc["ts"] = currentReading.timestamp;

  char buffer[512];
  serializeJson(doc, buffer);

  if (!mqttClient.publish(topic, buffer, 0)) {  // QoS 0 for telemetry
    Serial.println("❌ Failed to publish sensor data");
  }
}

// ============================================================================
// ACTUATOR CONTROL
// ============================================================================

void disableAllMotors() {
  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // Disable stepper (active HIGH)
  digitalWrite(PIN_FEED_MOTOR_PWM, LOW);   // Stop feed motor
  // TODO: Stop other actuators
  Serial.println("⚠️  All motors disabled");
}
