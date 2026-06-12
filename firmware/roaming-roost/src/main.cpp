// Roaming Roost — ESP32-WROOM-32 firmware
// Hardware: 4× mecanum wheels (L298N ×2), NEO-6M GPS, HC-SR04 ×4 (obstacles/boundary),
//           reed switch (dock detect), 12V LiFePO4, DHT22
// MQTT: tc/{deviceId}/sensors, tc/{deviceId}/state, tc/{deviceId}/alert
//       tc/{deviceId}/cmd/drive (subscribe), tc/{deviceId}/cmd/estop (subscribe QoS2 retain)

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <NewPing.h>
#include <esp_task_wdt.h>

// — Credentials —
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
#define DEVICE_ID "rr_001"
#endif

// — Motor pins: L298N #1 (Front Left, Front Right) —
#define FL_IN1  25
#define FL_IN2  26
#define FL_ENA  27   // PWM
#define FR_IN1  14
#define FR_IN2  12
#define FR_ENA  13   // PWM

// — Motor pins: L298N #2 (Rear Left, Rear Right) —
#define RL_IN1  33
#define RL_IN2  32
#define RL_ENA  15   // PWM
#define RR_IN1  21
#define RR_IN2  22
#define RR_ENA  23   // PWM

// — Sensors —
#define DOCK_REED_PIN   34   // INPUT_PULLUP — LOW when docked
#define SONAR_TRIG_F    4
#define SONAR_ECHO_F    5
#define SONAR_TRIG_B    18
#define SONAR_ECHO_B    19
#define GPS_RX          16
#define GPS_TX          17

#define SONAR_MAX_CM    200
#define OBSTACLE_CM      35   // stop if obstacle closer than this

// — Constants —
static const unsigned long SENSOR_INTERVAL_MS    = 10000;
static const unsigned long RECONNECT_INTERVAL_MS  = 5000;
static const unsigned long WATCHDOG_TIMEOUT_MS   = 8000;
static const unsigned long IDLE_MOTOR_TIMEOUT_MS = 3000;   // disable motors after 3s idle
static const int           MOTOR_IDLE_SPEED      = 0;
static const int           MOTOR_PATROL_SPEED    = 140;    // 0-255

// — State machine —
enum class SystemState { BOOT, CONNECTING, IDLE, RUNNING, DOCKING, ERROR, ESTOP };
static SystemState currentState = SystemState::BOOT;

// — Drive command —
struct DriveCmd {
  int   vx;      // forward/backward  -100..100
  int   vy;      // strafe left/right  -100..100
  int   omega;   // rotation          -100..100
  float speed;   // multiplier 0.0-1.0
  unsigned long receivedAt;
};
static DriveCmd pendingDrive = {0, 0, 0, 0.5f, 0};
static bool hasPendingDrive = false;

// — Runtime —
static WiFiClient wifiClient;
static PubSubClient mqttClient(wifiClient);
static TinyGPSPlus gps;
static HardwareSerial gpsSerial(1);
static NewPing sonarFront(SONAR_TRIG_F, SONAR_ECHO_F, SONAR_MAX_CM);
static NewPing sonarRear (SONAR_TRIG_B, SONAR_ECHO_B, SONAR_MAX_CM);

static unsigned long lastSensorPublish   = 0;
static unsigned long lastMotorActivity   = 0;
static unsigned long lastReconnectAttempt = 0;
static bool eStopRequested = false;
static bool isDocked       = false;
static bool returnToDock   = false;

// ── Forward declarations ─────────────────────────────────────────────────────
void transitionTo(SystemState next);
void handleIdle();
void handleRunning();
void handleDocking();
void handleError();
void handleEStop();
void reconnectIfNeeded();
void publishSensors();
void publishState(const char* stateStr);
void onMqttMessage(char* topic, uint8_t* payload, unsigned int length);
void setMecanumVelocity(int vx, int vy, int omega, float speed);
void stopAllMotors();
void disableAllMotors();
bool obstacleAhead();

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("[RoamingRoost] Boot");

  esp_task_wdt_init(WATCHDOG_TIMEOUT_MS / 1000, true);
  esp_task_wdt_add(NULL);

  // Motor pins
  int motorPins[] = { FL_IN1, FL_IN2, FR_IN1, FR_IN2, RL_IN1, RL_IN2, RR_IN1, RR_IN2 };
  for (int pin : motorPins) { pinMode(pin, OUTPUT); digitalWrite(pin, LOW); }
  // PWM channels
  ledcAttachPin(FL_ENA, 0); ledcSetup(0, 1000, 8);
  ledcAttachPin(FR_ENA, 1); ledcSetup(1, 1000, 8);
  ledcAttachPin(RL_ENA, 2); ledcSetup(2, 1000, 8);
  ledcAttachPin(RR_ENA, 3); ledcSetup(3, 1000, 8);
  stopAllMotors();

  pinMode(DOCK_REED_PIN, INPUT_PULLUP);

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

  // Feed GPS parser (non-blocking)
  while (gpsSerial.available()) gps.encode(gpsSerial.read());

  // Dock detection
  isDocked = (digitalRead(DOCK_REED_PIN) == LOW);

  if (eStopRequested) { transitionTo(SystemState::ESTOP); }

  switch (currentState) {
    case SystemState::CONNECTING:
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("[WiFi] Connected: " + WiFi.localIP().toString());
        transitionTo(isDocked ? SystemState::IDLE : SystemState::RUNNING);
      }
      break;
    case SystemState::IDLE:    handleIdle();    break;
    case SystemState::RUNNING: handleRunning(); break;
    case SystemState::DOCKING: handleDocking(); break;
    case SystemState::ERROR:   handleError();   break;
    case SystemState::ESTOP:   handleEStop();   break;
    default: break;
  }

  mqttClient.loop();
  reconnectIfNeeded();

  // Auto-disable motors after idle timeout (prevents coil heating)
  if (millis() - lastMotorActivity > IDLE_MOTOR_TIMEOUT_MS &&
      currentState != SystemState::RUNNING &&
      currentState != SystemState::DOCKING) {
    disableAllMotors();
  }
}

// ── State handlers ───────────────────────────────────────────────────────────
void handleIdle() {
  unsigned long now = millis();
  if (now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    publishSensors();
    lastSensorPublish = now;
  }
}

void handleRunning() {
  unsigned long now = millis();

  if (now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    publishSensors();
    lastSensorPublish = now;
  }

  if (returnToDock) {
    transitionTo(SystemState::DOCKING);
    return;
  }

  if (obstacleAhead()) {
    stopAllMotors();
    return;
  }

  // Execute drive command if fresh (<500ms old)
  if (hasPendingDrive && (now - pendingDrive.receivedAt) < 500) {
    setMecanumVelocity(pendingDrive.vx, pendingDrive.vy, pendingDrive.omega, pendingDrive.speed);
    lastMotorActivity = now;
  } else {
    stopAllMotors();
    hasPendingDrive = false;
  }
}

void handleDocking() {
  if (isDocked) {
    stopAllMotors();
    transitionTo(SystemState::IDLE);
    returnToDock = false;
    return;
  }
  // Stub: TODO — implement dock homing via GPS waypoint or IR beacon
  // For now, drive slowly forward and rely on reed switch detection
  setMecanumVelocity(30, 0, 0, 0.3f);
  lastMotorActivity = millis();
}

void handleError() {
  stopAllMotors();
  publishState("error");
  delay(3000);
  transitionTo(SystemState::IDLE);
}

void handleEStop() {
  disableAllMotors();
  publishState("estop");
}

// ── State machine ────────────────────────────────────────────────────────────
void transitionTo(SystemState next) {
  if (next == currentState) return;
  const char* names[] = { "BOOT","CONNECTING","IDLE","RUNNING","DOCKING","ERROR","ESTOP" };
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
    if (mqttClient.connect("roaming-roost-" DEVICE_ID)) {
      Serial.println("[MQTT] Connected");
      mqttClient.subscribe("tc/" DEVICE_ID "/cmd/drive",  1);
      mqttClient.subscribe("tc/" DEVICE_ID "/cmd/estop",  2);
      mqttClient.subscribe("tc/broadcast/alert",           2);
    } else {
      Serial.printf("[MQTT] Connect failed, rc=%d\n", mqttClient.state());
    }
  }
}

void onMqttMessage(char* topic, uint8_t* payload, unsigned int length) {
  char buf[512];
  size_t copyLen = min((unsigned int)sizeof(buf) - 1, length);
  memcpy(buf, payload, copyLen);
  buf[copyLen] = '\0';

  JsonDocument doc;
  if (deserializeJson(doc, buf) != DeserializationError::Ok) {
    Serial.printf("[MQTT] Invalid JSON on topic %s\n", topic);
    return;
  }

  if (strstr(topic, "/cmd/estop")) {
    bool active = doc["active"] | false;
    eStopRequested = active;
    if (!active && currentState == SystemState::ESTOP) {
      transitionTo(SystemState::IDLE);
    }
  } else if (strstr(topic, "/cmd/drive")) {
    // {"vx":50,"vy":0,"omega":0,"speed":0.5}  vx/vy/omega in -100..100
    pendingDrive.vx         = doc["vx"]    | 0;
    pendingDrive.vy         = doc["vy"]    | 0;
    pendingDrive.omega      = doc["omega"] | 0;
    pendingDrive.speed      = doc["speed"] | 0.5f;
    pendingDrive.receivedAt = millis();
    hasPendingDrive         = true;
    if (currentState == SystemState::IDLE) transitionTo(SystemState::RUNNING);
  } else if (strstr(topic, "broadcast/alert")) {
    // Predator detected by WatchTower — return to dock
    const char* alertType = doc["type"] | "";
    if (strcmp(alertType, "predator") == 0) {
      Serial.println("[Alert] Predator detected — returning to dock");
      returnToDock = true;
    }
  }
}

// ── Sensor publishing ─────────────────────────────────────────────────────────
void publishSensors() {
  if (!mqttClient.connected()) return;
  JsonDocument doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["isDocked"]  = isDocked;
  doc["state"]     = currentState == SystemState::ESTOP ? "estop" :
                     currentState == SystemState::RUNNING ? "running" :
                     currentState == SystemState::DOCKING ? "docking" : "idle";
  if (gps.location.isValid()) {
    doc["lat"] = gps.location.lat();
    doc["lng"] = gps.location.lng();
  }
  doc["gpsSats"]   = gps.satellites.value();
  doc["sonarF_cm"] = sonarFront.ping_cm();
  doc["sonarR_cm"] = sonarRear.ping_cm();
  doc["freeHeap"]  = ESP.getFreeHeap();
  doc["ts"]        = millis();

  char buf[512];
  serializeJson(doc, buf, sizeof(buf));
  mqttClient.publish("tc/" DEVICE_ID "/sensors", buf, false);
}

void publishState(const char* stateStr) {
  if (!mqttClient.connected()) return;
  JsonDocument doc;
  doc["state"]    = stateStr;
  doc["deviceId"] = DEVICE_ID;
  doc["isDocked"] = isDocked;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"]   = millis() / 1000;
  doc["rssi"]     = WiFi.RSSI();
  doc["ts"]       = millis();
  char buf[256];
  serializeJson(doc, buf, sizeof(buf));
  mqttClient.publish("tc/" DEVICE_ID "/state", buf, 1, false);
}

// ── Mecanum drive ─────────────────────────────────────────────────────────────
// Mecanum kinematics: each wheel speed = vx ± vy ± omega
void setMecanumVelocity(int vx, int vy, int omega, float speed) {
  // Clamp inputs
  vx    = constrain(vx,    -100, 100);
  vy    = constrain(vy,    -100, 100);
  omega = constrain(omega, -100, 100);
  speed = constrain(speed,  0.0f, 1.0f);

  int fl = vx + vy + omega;
  int fr = vx - vy - omega;
  int rl = vx - vy + omega;
  int rr = vx + vy - omega;

  // Normalize and scale
  int maxVal = max({abs(fl), abs(fr), abs(rl), abs(rr), 100});
  auto toSpeed = [&](int v) -> int {
    return (int)(abs(v) / (float)maxVal * 255.0f * speed);
  };
  auto setMotor = [&](int in1, int in2, int enaChannel, int v) {
    digitalWrite(in1, v >= 0 ? HIGH : LOW);
    digitalWrite(in2, v >= 0 ? LOW  : HIGH);
    ledcWrite(enaChannel, toSpeed(v));
  };

  setMotor(FL_IN1, FL_IN2, 0, fl);
  setMotor(FR_IN1, FR_IN2, 1, fr);
  setMotor(RL_IN1, RL_IN2, 2, rl);
  setMotor(RR_IN1, RR_IN2, 3, rr);
}

void stopAllMotors() {
  ledcWrite(0, 0); ledcWrite(1, 0); ledcWrite(2, 0); ledcWrite(3, 0);
}

void disableAllMotors() {
  stopAllMotors();
  // De-energize coils by setting IN1=LOW, IN2=LOW
  int pins[] = { FL_IN1, FL_IN2, FR_IN1, FR_IN2, RL_IN1, RL_IN2, RR_IN1, RR_IN2 };
  for (int pin : pins) { digitalWrite(pin, LOW); }
}

bool obstacleAhead() {
  unsigned int d = sonarFront.ping_cm();
  return (d > 0 && d < OBSTACLE_CM);
}
