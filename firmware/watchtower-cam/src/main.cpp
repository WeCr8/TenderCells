/**
 * Tender Cells — Camera Node (WatchTower / ChickenEye eye)
 *
 * Seeed XIAO ESP32-S3 Sense (OV2640). Two jobs:
 *   1) Serve a live MJPEG stream at  http://<lan-ip>/stream
 *   2) Publish that streamUrl in the MQTT heartbeat (peripheral="camera") so the
 *      TenderCells OS auto-registers the node and renders the live feed where placed.
 *
 * Conventions matched to the rest of the tree: WiFiManager captive-portal provisioning
 * (no hardcoded creds), non-blocking MQTT reconnect, watchdog, E-STOP subscriber.
 * Motion never runs here — a camera has no actuators — but E-STOP is still honored so
 * the node reports estop state like every other device.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_task_wdt.h>
#include "esp_camera.h"
#include "esp_http_server.h"

// ── XIAO ESP32-S3 Sense camera pin map (OV2640) ──────────────────────────────
#define PWDN_GPIO_NUM   -1
#define RESET_GPIO_NUM  -1
#define XCLK_GPIO_NUM   10
#define SIOD_GPIO_NUM   40
#define SIOC_GPIO_NUM   39
#define Y9_GPIO_NUM     48
#define Y8_GPIO_NUM     11
#define Y7_GPIO_NUM     12
#define Y6_GPIO_NUM     14
#define Y5_GPIO_NUM     16
#define Y4_GPIO_NUM     18
#define Y3_GPIO_NUM     17
#define Y2_GPIO_NUM     15
#define VSYNC_GPIO_NUM  38
#define HREF_GPIO_NUM   47
#define PCLK_GPIO_NUM   13

static const unsigned long HEARTBEAT_INTERVAL_MS = 10000;
static const unsigned long MQTT_RECONNECT_MS     = 5000;
static const unsigned long WATCHDOG_TIMEOUT_S    = 8;

Preferences prefs;
String brokerIp, brokerPort, deviceId, productType;

WiFiClient net;
PubSubClient mqtt(net);
httpd_handle_t streamServer = NULL;

volatile bool eStopActive = false;
unsigned long lastHeartbeat = 0, lastReconnect = 0;

String topicSensors() { return "tc/" + deviceId + "/sensors"; }
String topicState()   { return "tc/" + deviceId + "/state"; }
String topicEstop()   { return "tc/" + deviceId + "/cmd/estop"; }

// ── MJPEG stream handler (multipart/x-mixed-replace) ─────────────────────────
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

static esp_err_t streamHandler(httpd_req_t* req) {
  esp_err_t res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  char part[64];
  while (true) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) { res = ESP_FAIL; break; }
    size_t hlen = snprintf(part, sizeof(part), STREAM_PART, fb->len);
    res  = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, part, hlen);
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    if (res != ESP_OK) break;  // client disconnected
  }
  return res;
}

void startStreamServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;
  httpd_uri_t uri = { .uri = "/stream", .method = HTTP_GET, .handler = streamHandler, .user_ctx = NULL };
  if (httpd_start(&streamServer, &config) == ESP_OK) {
    httpd_register_uri_handler(streamServer, &uri);
    Serial.println("[CAM] MJPEG server on /stream");
  } else {
    Serial.println("[CAM] failed to start stream server");
  }
}

bool initCamera() {
  camera_config_t c = {};
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM;  c.pin_d1 = Y3_GPIO_NUM;  c.pin_d2 = Y4_GPIO_NUM;  c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM;  c.pin_d5 = Y7_GPIO_NUM;  c.pin_d6 = Y8_GPIO_NUM;  c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM; c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size   = psramFound() ? FRAMESIZE_VGA : FRAMESIZE_QVGA;
  c.jpeg_quality = 12;
  c.fb_count     = psramFound() ? 2 : 1;
  c.fb_location  = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  esp_err_t err = esp_camera_init(&c);
  if (err != ESP_OK) { Serial.printf("[CAM] init failed 0x%x\n", err); return false; }
  return true;
}

void publishHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["node"]        = "camera";
  doc["productType"] = productType;
  doc["peripheral"]  = "camera";
  doc["streamUrl"]   = "http://" + WiFi.localIP().toString() + "/stream";
  doc["rssi"]        = WiFi.RSSI();
  doc["ts"]          = millis();
  char buf[256];
  size_t n = serializeJson(doc, buf);
  mqtt.publish(topicSensors().c_str(), (const uint8_t*)buf, n);
}

void publishState(const char* s) {
  StaticJsonDocument<128> doc;
  doc["state"] = s; doc["ts"] = millis();
  char buf[128]; size_t n = serializeJson(doc, buf);
  mqtt.publish(topicState().c_str(), (const uint8_t*)buf, n, strcmp(s, "estop") == 0);
}

void onMqtt(char* topic, byte* payload, unsigned int len) {
  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, payload, len)) return;
  if (String(topic) == topicEstop()) {
    eStopActive = doc["active"] | false;
    publishState(eStopActive ? "estop" : "idle");
  }
}

bool reconnect() {
  String id = "tc-cam-" + deviceId + "-" + String((uint32_t)esp_random(), HEX);
  if (mqtt.connect(id.c_str())) {
    mqtt.subscribe(topicEstop().c_str(), 1);
    publishState("idle");
    return true;
  }
  return false;
}

void provision() {
  prefs.begin("tccam", false);
  brokerIp    = prefs.getString("brokerIp", "");
  brokerPort  = prefs.getString("brokerPort", "1883");
  deviceId    = prefs.getString("deviceId", "");
  productType = prefs.getString("product", "watchtower");
  if (deviceId.isEmpty()) {
    uint64_t mac = ESP.getEfuseMac();
    char b[24]; snprintf(b, sizeof(b), "cam_%04X", (uint16_t)(mac & 0xFFFF));
    deviceId = b;
  }
  WiFiManager wm;
  WiFiManagerParameter pB("broker", "Broker IP (blank = auto)", brokerIp.c_str(), 40);
  WiFiManagerParameter pP("port", "Broker port", brokerPort.c_str(), 6);
  WiFiManagerParameter pI("devid", "Device ID", deviceId.c_str(), 22);
  WiFiManagerParameter pT("product", "Product type", productType.c_str(), 20);
  wm.addParameter(&pB); wm.addParameter(&pP); wm.addParameter(&pI); wm.addParameter(&pT);
  wm.setConfigPortalTimeout(0);
  wm.autoConnect("TenderCam-Setup");
  brokerIp = pB.getValue(); brokerPort = pP.getValue();
  deviceId = pI.getValue(); productType = pT.getValue();
  if (productType.isEmpty()) productType = "watchtower";
  prefs.putString("brokerIp", brokerIp); prefs.putString("brokerPort", brokerPort);
  prefs.putString("deviceId", deviceId); prefs.putString("product", productType);
  prefs.end();
}

void discoverBroker() {
  if (brokerIp.length() || WiFi.status() != WL_CONNECTED) return;
  if (!MDNS.begin(deviceId.c_str())) return;
  if (MDNS.queryService("mqtt", "tcp") > 0) {
    brokerIp = MDNS.IP(0).toString(); brokerPort = String(MDNS.port(0));
  }
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println("\n=== Tender Cells Camera Node ===");
  if (!initCamera()) Serial.println("[CAM] no camera — check board/ribbon");

  provision();
  discoverBroker();
  if (WiFi.status() == WL_CONNECTED) startStreamServer();

  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  uint16_t port = (uint16_t)brokerPort.toInt(); if (!port) port = 1883;
  mqtt.setServer(brokerIp.c_str(), port);
  mqtt.setCallback(onMqtt);
  mqtt.setSocketTimeout(4);
  Serial.printf("[NET] stream: http://%s/stream\n", WiFi.localIP().toString().c_str());
}

void loop() {
  esp_task_wdt_reset();
  if (!mqtt.connected()) {
    if (millis() - lastReconnect > MQTT_RECONNECT_MS) { lastReconnect = millis(); reconnect(); }
    return;
  }
  mqtt.loop();
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    publishHeartbeat();
    publishState(eStopActive ? "estop" : "idle");
  }
}
