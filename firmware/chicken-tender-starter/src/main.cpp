// Tender Cells - Chicken Tender Starter (door controller)
// Seeed XIAO ESP32-S3 + Pololu DRV8874 + 12 V cord-lift door actuator + 2 reeds + DHT20.
//
// Safety model
//  - The NC E-STOP is wired IN SERIES with the DRV8874 SLEEP line (D7 -> E-STOP -> SLEEP).
//    Pressing it (or cutting the wire) sleeps the driver in hardware; firmware is not needed
//    to stop the motor. D10 reads the SLEEP node so the app sees the stop.
//  - The door closes under its own weight: closing only extends the rod and lets the cord
//    pay out. The actuator never pushes the door down onto a chicken.
//  - The driver current limit is ~2.0 A in hardware (20 k VREF resistor, see hw yaml).
//  - Every E-STOP (button, cut wire, app) LATCHES: the latch is stored in NVS, D7 is held
//    low (driver asleep) and the door stays put across reboots / watchdog resets until the app
//    sends an explicit {"active":false} with the loop closed. A press shorter than one loop
//    (or one that ends while MQTT is connecting) is caught by a FALLING-edge ISR on D10.
//  - Door logic (lib/door_logic) is host-tested: reeds, timeouts, jam, E-STOP latch,
//    reversal brake + dwell, reboot restore of the last commanded position, millis() rollover.
//
// Provisioning: captive portal "ChickenTender-Setup" (WiFi, MQTT broker, MQTT username +
// password or a Tender Cells API key tck_... with a blank username), stored in NVS.
// MQTT: tc/{id}/cmd/door {"state":"open"|"close"|"stop"}, tc/{id}/cmd/estop {"active":bool}
//       -> tc/{id}/state (retained), tc/{id}/sensors, tc/{id}/alert

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT20.h>
#include "esp_task_wdt.h"
#include "pins.h"
#include "door_logic.h"

#ifndef CT_TRAVEL_TIMEOUT_MS
#define CT_TRAVEL_TIMEOUT_MS 55000
#endif
#ifndef CT_TIER_NAME
#define CT_TIER_NAME "starter"
#endif

static const uint32_t WATCHDOG_S            = 8;
static const uint32_t STATE_PUBLISH_MS      = 10000;
static const uint32_t SENSOR_PUBLISH_MS     = 30000;
static const uint32_t MQTT_RETRY_MS         = 5000;
static const uint32_t WIFI_RETRY_MS         = 30000;
static const int      DHT_FAULT_AFTER       = 5;
static const uint32_t MQTT_TCP_TIMEOUT_MS   = 1500;   // bounded TCP connect (well under the WDT)

char mqttBroker[40] = "192.168.1.100";
char deviceId[32]   = "chicken_tender_starter_001";
int  mqttPort       = 1883;
String mqttUser;   // blank = anonymous, or = device id when the password is an API key
String mqttPass;   // MQTT password or Tender Cells API key (tck_...)

Preferences prefs;
WiFiClient net;
PubSubClient mqtt(net);
DHT20 dht(&Wire);

door::Config makeConfig() {
  door::Config c;
  c.travelTimeout_ms = CT_TRAVEL_TIMEOUT_MS;
  return c;
}
door::Controller doorCtl(makeConfig());

bool softEStop = false;          // app E-STOP (hardware E-STOP is the SLEEP loop)
volatile bool estopEdge = false; // set by the D10 FALLING-edge ISR, consumed by readInputs()
bool driverAwake = false;

// Any fall of the SLEEP node (button pressed, wire cut, D7 pulled low) latches the stop even if
// the press is over before loop() runs again. Holding D7 low keeps the driver asleep after the
// button springs back, so the door cannot resume on its own.
void IRAM_ATTR onEStopEdge() {
  estopEdge = true;
  digitalWrite(PIN_DRV_ENABLE, LOW);
}
int8_t appliedMotor = 0;
door::State lastState = door::State::Idle;
uint32_t lastStatePub = 0, lastSensorPub = 0, lastMqttTry = 0, lastWifiTry = 0;
float tempC = NAN, humidity = NAN;
int dhtFailStreak = 0;

// ---------------------------------------------------------------------------
// Hardware I/O
// ---------------------------------------------------------------------------

// consumeEdge=false for reporting only: the ISR edge must reach the door controller.
door::Inputs readInputs(bool consumeEdge = true) {
  door::Inputs in;
  in.reedClosed  = digitalRead(PIN_REED_CLOSED) == LOW;
  in.reedOpen    = digitalRead(PIN_REED_OPEN) == LOW;
  // D7 drives the loop high unless the app E-STOP is set; D10 sees it only if the NC
  // button is closed. Either open -> not OK.
  const bool edge = estopEdge;
  if (consumeEdge) estopEdge = false;
  in.estopOk     = !softEStop && !edge && driverAwake && digitalRead(PIN_ESTOP_SENSE) == HIGH;
  in.driverFault = digitalRead(PIN_DRV_FAULT) == LOW;
  const uint32_t mv = analogReadMilliVolts(PIN_DRV_CS);
  in.current_mA  = (uint16_t)((mv * 1000.0f) / CS_MV_PER_A);
  return in;
}

void applyMotor(int8_t m) {
  if (m == appliedMotor) return;
  if (m == 0) {
    ledcWrite(MOT_PWM_CH, 0);                       // EN low = brake (PH/EN mode)
  } else {
    digitalWrite(PIN_MOT_PH, m > 0 ? MOT_PH_OPEN : !MOT_PH_OPEN);
    ledcWrite(MOT_PWM_CH, (1u << MOT_PWM_BITS) - 1); // full speed; driver limits current
  }
  appliedMotor = m;
}

door::Pos loadCommanded() {
  // NVS may hold garbage (first boot on a reused board, older firmware): anything that is
  // not a known position is Unknown, which the controller turns into a safe close.
  const uint8_t v = prefs.getUChar("door", (uint8_t)door::Pos::Unknown);
  if (v == (uint8_t)door::Pos::Open) return door::Pos::Open;
  if (v == (uint8_t)door::Pos::Closed) return door::Pos::Closed;
  return door::Pos::Unknown;
}

void saveCommandedIfChanged() {
  if (doorCtl.takeCommandedChanged()) prefs.putUChar("door", (uint8_t)doorCtl.commanded());
}

// The E-STOP latch survives reboots and watchdog resets.
void saveLatchIfChanged() {
  if (!doorCtl.takeLatchChanged()) return;
  prefs.putBool("estop", doorCtl.estopLatched());
  if (doorCtl.estopLatched()) { digitalWrite(PIN_DRV_ENABLE, LOW); driverAwake = false; applyMotor(0); }
}

void wakeDriver() {
  digitalWrite(PIN_DRV_ENABLE, HIGH);
  delay(2);                 // DRV8874 wake time (~1 ms); also lets D10 settle high
  estopEdge = false;        // our own rising edge is not a press
  driverAwake = true;
}

// ---------------------------------------------------------------------------
// MQTT
// ---------------------------------------------------------------------------

void topic(char* out, size_t n, const char* leaf) { snprintf(out, n, "tc/%s/%s", deviceId, leaf); }

void publishAlert(const char* type, const char* msg) {
  if (!mqtt.connected()) return;
  char t[64]; topic(t, sizeof(t), "alert");
  JsonDocument d;
  d["type"] = type; d["message"] = msg; d["ts"] = millis();
  char buf[192]; const size_t n = serializeJson(d, buf, sizeof(buf));
  mqtt.publish(t, (const uint8_t*)buf, n, false);
}

void publishState() {
  if (!mqtt.connected()) return;
  char t[64]; topic(t, sizeof(t), "state");
  const door::Inputs in = readInputs(false);
  JsonDocument d;
  d["door"]       = door::stateName(doorCtl.state());
  d["commanded"]  = door::posName(doorCtl.commanded());
  d["fault"]      = door::faultName(doorCtl.fault());
  d["estop"]      = doorCtl.estopLatched() || !in.estopOk;
  d["estopLatched"] = doorCtl.estopLatched();
  d["reedOpen"]   = in.reedOpen;
  d["reedClosed"] = in.reedClosed;
  d["current_mA"] = in.current_mA;
  d["tier"]       = CT_TIER_NAME;
  d["uptime"]     = millis() / 1000;
  d["rssi"]       = WiFi.RSSI();
  char buf[320]; const size_t n = serializeJson(d, buf, sizeof(buf));
  mqtt.publish(t, (const uint8_t*)buf, n, true);   // retained: late subscribers see E-STOP
}

void publishSensors() {
  if (!mqtt.connected()) return;
  char t[64]; topic(t, sizeof(t), "sensors");
  JsonDocument d;
  if (isnan(tempC)) d["temp"] = nullptr; else d["temp"] = tempC * 9.0f / 5.0f + 32.0f;  // F, like WROOM
  if (isnan(humidity)) d["humidity"] = nullptr; else d["humidity"] = humidity;
  d["sensorFault"] = dhtFailStreak >= DHT_FAULT_AFTER;
  d["chickenCount"] = nullptr;   // no headcount sensor on the starter: unknown
  d["doorState"] = door::stateName(doorCtl.state());
  d["ts"] = millis();
  char buf[256]; const size_t n = serializeJson(d, buf, sizeof(buf));
  mqtt.publish(t, (const uint8_t*)buf, n, false);
}

void onMessage(char* t, byte* payload, unsigned int len) {
  JsonDocument d;
  if (deserializeJson(d, payload, len)) return;
  const char* leaf = strrchr(t, '/'); leaf = leaf ? leaf + 1 : t;
  const door::Inputs in = readInputs();
  const uint32_t now = millis();
  if (strcmp(leaf, "estop") == 0) {
    // Only an explicit boolean counts. {"active":false} is the ONLY way to clear; a missing,
    // misspelled or non-bool "active" is treated as a stop request, never as a reset.
    const bool explicitClear = d["active"].is<bool>() && !d["active"].as<bool>();
    if (!explicitClear) {
      softEStop = true;
      digitalWrite(PIN_DRV_ENABLE, LOW); driverAwake = false;
      applyMotor(0);
      doorCtl.update(readInputs(), now);          // estopOk=false -> latch
      saveLatchIfChanged();
    } else {
      softEStop = false;
      wakeDriver();
      if (!doorCtl.clearEStop(readInputs())) {    // button still pressed / wire open
        digitalWrite(PIN_DRV_ENABLE, LOW); driverAwake = false;
        publishAlert("safety", "E-STOP reset refused: loop still open");
      }
      saveLatchIfChanged();
    }
    publishState();
  } else if (strcmp(leaf, "door") == 0) {
    const char* s = d["state"] | "";
    door::Cmd c = door::Cmd::None;
    if (strcmp(s, "open") == 0) c = door::Cmd::Open;
    else if (strcmp(s, "close") == 0) c = door::Cmd::Close;
    else if (strcmp(s, "stop") == 0) c = door::Cmd::Stop;
    if (!doorCtl.command(c, in, now)) publishAlert("safety", "door command refused (E-STOP latched/open or reed fault)");
    saveCommandedIfChanged();
    saveLatchIfChanged();
    publishState();
  }
}

void connectMqttIfNeeded() {
  if (mqtt.connected() || WiFi.status() != WL_CONNECTED) return;
  const uint32_t now = millis();
  if (now - lastMqttTry < MQTT_RETRY_MS) return;
  lastMqttTry = now;
  char id[48]; snprintf(id, sizeof(id), "%s_%04lx", deviceId, (unsigned long)(esp_random() & 0xffff));
  // Bounded, so a dead broker cannot stall the loop: TCP connect with our own timeout first
  // (PubSubClient reuses an already-connected client), then a 2 s MQTT handshake timeout.
  // A press during this window is still latched by the D10 ISR.
  if (!net.connected() && !net.connect(mqttBroker, mqttPort, MQTT_TCP_TIMEOUT_MS)) return;
  // Same credentials model as firmware/starter-node: username + password, or a Tender Cells
  // API key (tck_...) as the password with a blank username -> connect as this device id.
  String user = mqttUser;
  if (user.isEmpty() && mqttPass.startsWith("tck_")) user = deviceId;
  const bool ok = mqttPass.length() ? mqtt.connect(id, user.c_str(), mqttPass.c_str())
                                    : mqtt.connect(id);
  if (!ok) { net.stop(); return; }
  {
    char t[64];
    topic(t, sizeof(t), "cmd/estop"); mqtt.subscribe(t, 1);
    topic(t, sizeof(t), "cmd/door");  mqtt.subscribe(t, 1);
    publishState();
  }
}

void provision() {
  prefs.getString("broker", mqttBroker, sizeof(mqttBroker));
  prefs.getString("devid", deviceId, sizeof(deviceId));
  mqttPort = prefs.getInt("port", mqttPort);
  if (mqttPort <= 0 || mqttPort > 65535) mqttPort = 1883;
  mqttUser = prefs.getString("mqttUser", "");
  mqttPass = prefs.getString("mqttPass", "");
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);
  wm.setConfigPortalBlocking(true);
  char portStr[8]; snprintf(portStr, sizeof(portStr), "%d", mqttPort);
  WiFiManagerParameter pB("broker", "MQTT broker IP", mqttBroker, sizeof(mqttBroker) - 1);
  WiFiManagerParameter pP("port", "MQTT port", portStr, 6);
  WiFiManagerParameter pD("devid", "Device ID", deviceId, sizeof(deviceId) - 1);
  WiFiManagerParameter pU("mqttuser", "MQTT username (blank if open, or if you paste an API key below)", mqttUser.c_str(), 40);
  WiFiManagerParameter pW("mqttpass", "MQTT password or API key (tck_...) - blank keeps the saved one", "", 120, "type='password'");
  wm.addParameter(&pB); wm.addParameter(&pP); wm.addParameter(&pD);
  wm.addParameter(&pU); wm.addParameter(&pW);
  if (!wm.autoConnect("ChickenTender-Setup")) return;   // door logic keeps running offline
  snprintf(mqttBroker, sizeof(mqttBroker), "%s", pB.getValue());
  snprintf(deviceId, sizeof(deviceId), "%s", pD.getValue());
  const int port = atoi(pP.getValue());
  mqttPort = (port > 0 && port <= 65535) ? port : 1883;   // typo in the portal -> default port
  prefs.putString("broker", mqttBroker);
  prefs.putString("devid", deviceId);
  prefs.putInt("port", mqttPort);
  mqttUser = pU.getValue(); mqttUser.trim();
  String newPass = pW.getValue();
  if (newPass.length()) mqttPass = newPass;   // blank keeps the saved secret
  prefs.putString("mqttUser", mqttUser);
  prefs.putString("mqttPass", mqttPass);
}

// ---------------------------------------------------------------------------
// Setup / loop
// ---------------------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  // Motor off before anything else: EN low, driver asleep until we are ready.
  pinMode(PIN_DRV_ENABLE, OUTPUT); digitalWrite(PIN_DRV_ENABLE, LOW);
  pinMode(PIN_MOT_PH, OUTPUT);     digitalWrite(PIN_MOT_PH, LOW);
  ledcSetup(MOT_PWM_CH, MOT_PWM_HZ, MOT_PWM_BITS);
  ledcAttachPin(PIN_MOT_EN, MOT_PWM_CH);
  ledcWrite(MOT_PWM_CH, 0);
  pinMode(PIN_DRV_FAULT, INPUT_PULLUP);
  pinMode(PIN_REED_CLOSED, INPUT_PULLUP);
  pinMode(PIN_REED_OPEN, INPUT_PULLUP);
  pinMode(PIN_ESTOP_SENSE, INPUT);       // carrier pulls SLEEP low when the loop is open
  analogSetPinAttenuation(PIN_DRV_CS, ADC_11db);

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  dht.begin();

  prefs.begin("tc", false);
  // Provisioning can block up to 180 s on first boot (saved WiFi: ~1 s), so the door is
  // only driven after it, when loop() supervises every move.
  provision();

  // A latched E-STOP (app stop, button, cut wire) survives reboot / WDT reset: boot into the
  // stopped state with the driver left asleep. Otherwise wake the driver (PMODE strapped low ->
  // PH/EN latched on wake) and restore the last COMMANDED door position (first boot: closed).
  const bool latched = prefs.getBool("estop", false);
  softEStop = latched;
  if (!latched) wakeDriver();
  attachInterrupt(digitalPinToInterrupt(PIN_ESTOP_SENSE), onEStopEdge, FALLING);
  doorCtl.begin(loadCommanded(), readInputs(), millis(), latched);
  saveCommandedIfChanged();
  saveLatchIfChanged();
  applyMotor(doorCtl.motor());
  mqtt.setServer(mqttBroker, mqttPort);
  mqtt.setCallback(onMessage);
  mqtt.setBufferSize(512);
  mqtt.setSocketTimeout(2);   // MQTT handshake bound, well below the 8 s watchdog

  esp_task_wdt_init(WATCHDOG_S, true);
  esp_task_wdt_add(NULL);
}

void loop() {
  esp_task_wdt_reset();
  const uint32_t now = millis();

  const door::Inputs in = readInputs();
  applyMotor(doorCtl.update(in, now));
  saveCommandedIfChanged();
  saveLatchIfChanged();
  if (doorCtl.state() != lastState) {
    if (doorCtl.state() == door::State::Fault) publishAlert("door", door::faultName(doorCtl.fault()));
    if (doorCtl.state() == door::State::EStop) publishAlert("safety", "E-STOP open: door stopped");
    lastState = doorCtl.state();
    publishState();
  }

  if (WiFi.status() != WL_CONNECTED && now - lastWifiTry >= WIFI_RETRY_MS) {
    lastWifiTry = now;
    WiFi.reconnect();
  }
  connectMqttIfNeeded();
  if (mqtt.connected()) mqtt.loop();

  if (now - lastSensorPub >= SENSOR_PUBLISH_MS) {
    lastSensorPub = now;
    // One bad read never stops anything: keep the last good value, alert when persistent.
    if (dht.read() == DHT20_OK) {
      tempC = dht.getTemperature();
      humidity = dht.getHumidity();
      dhtFailStreak = 0;
    } else if (++dhtFailStreak == DHT_FAULT_AFTER) {
      publishAlert("sensor", "DHT20 not responding");
    }
    publishSensors();
  }
  if (now - lastStatePub >= STATE_PUBLISH_MS) {
    lastStatePub = now;
    publishState();
  }
}
