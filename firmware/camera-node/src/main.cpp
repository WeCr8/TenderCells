/**
 * Tender Cells - single-camera, battery-powered Camera Node
 *
 * Seeed XIAO ESP32-S3 Sense (OV2640 / OV3660). Jobs:
 *   1) Serve a live MJPEG stream at  http://<lan-ip>/stream
 *   2) Publish that streamUrl in the MQTT heartbeat (peripheral="camera") so the
 *      TenderCells OS auto-registers the node and renders the live feed where placed.
 *   3) Stamp every frame at CAPTURE time (driver DMA timestamp on the esp_timer
 *      monotonic clock, mapped to an SNTP-disciplined epoch) and carry the stamp,
 *      a sequence number and clock-sync quality in each multipart part header.
 *      Browsers/ffmpeg ignore the extra headers; dataset recorders read them.
 *   4) Report clock offset / sync quality at http://<lan-ip>:81/status and offer a
 *      cheap http://<lan-ip>:81/time probe for host-side offset estimation.
 *
 * Operating model (docs/CAMERA_TIMING.md):
 *   - ONE stream client: the recorder during a session, otherwise the relay that
 *     viewers watch. Nobody opens /stream directly.
 *   - Wi-Fi power-save is ON when idle (battery). It is switched OFF automatically
 *     while a /stream client is connected or a /time probe (timing audit / recorder
 *     offset estimation) ran recently, then restored. {"wifiSleep":false} = always off.
 *   - LAN-only, no token (yet). CORS: /stream and /status are readable from the one
 *     configured browser origin (corsOrigin) only; /time stays readable from anywhere.
 *   - Setup AP TenderCam-Setup is WPA2 with a per-device password derived from a
 *     random secret generated on first boot (NVS), printed on serial every boot.
 *
 * Timing contract (also in docs/CAMERA_TIMING.md), per multipart part:
 *   X-Frame-Seq          global frame counter (unique across clients)
 *   X-Stream-Seq         per-connection counter (gaps = frames this client missed)
 *   X-Capture-Mono-Us    device monotonic µs (esp_timer) at start of frame DMA
 *   X-Capture-Epoch-Us   Unix epoch µs at capture (only when SNTP-synced)
 *   X-Clock-Synced       1 / 0
 *   X-Clock-Source       sntp | none
 *   X-Capture-Stamp      driver | fb_get   (fb_get = fallback, less accurate)
 *   X-Trigger-Seq / X-Trigger-Mono-Us   last sync-input edge (when enabled)
 *
 * Honest limits: the OV2640/OV3660 on the Sense board has no exposure-trigger
 * input, and Wi-Fi SNTP is typically good to a few ms, not <1 ms. The optional
 * sync input (D3/GPIO4) timestamps a shared trigger edge on this device's clock
 * (~10 µs ISR latency) so recordings can be aligned against other sensors on the
 * same wire; it does NOT start an exposure.
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
#include <esp_timer.h>
#include <esp_sntp.h>
#include <esp_random.h>
#include <sys/time.h>
#include <atomic>
#include "esp_camera.h"
#include "esp_http_server.h"

// ── XIAO ESP32-S3 Sense camera pin map (OV2640/OV3660) ───────────────────────
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

// Optional sync/trigger INPUT. D3 = GPIO4 is not used by the camera, mic, microSD,
// or the documented D0 relay / D1 digital-input / D4-D5 I2C pins. 3.3 V logic only.
#define SYNC_IN_GPIO_NUM 4

static const unsigned long HEARTBEAT_INTERVAL_MS  = 10000;
static const unsigned long MQTT_RECONNECT_MS      = 5000;
static const unsigned long WIFI_RECONNECT_MS      = 10000;
static const unsigned long BROKER_DISCOVERY_MS    = 30000;
static const unsigned long WATCHDOG_TIMEOUT_S     = 8;
static const uint32_t      PORTAL_TIMEOUT_SAVED_S = 300;    // reboot + retry saved Wi-Fi
static const uint32_t      SNTP_INTERVAL_MS       = 5UL * 60UL * 1000UL;
static const uint8_t       DEFAULT_FPS            = 10;     // battery + airtime; divides a 30 Hz control loop
static const uint8_t       MAX_FPS                = 30;
static const int64_t       STREAM_GRACE_US        = 10LL * 1000000LL;  // keep low-latency after a stream ends
static const int64_t       TIME_PROBE_HOLD_US     = 30LL * 1000000LL;  // /time probe => audit/recorder starting
static const char*         SETUP_AP_SSID          = "TenderCam-Setup";
static const int64_t       MIN_VALID_EPOCH_US     = 1704067200LL * 1000000LL; // 2024-01-01

Preferences prefs;
String brokerIp, brokerPort, deviceId, productType, ntpServer, corsOrigin;

WiFiClient net;
PubSubClient mqtt(net);
httpd_handle_t streamServer = NULL;
httpd_handle_t statusServer = NULL;

volatile bool eStopActive = false;
unsigned long lastHeartbeat = 0, lastReconnect = 0;
unsigned long lastWifiReconnect = 0, lastBrokerDiscovery = 0;
bool mdnsStarted = false;

String topicSensors() { return "tc/" + deviceId + "/sensors"; }
String topicState()   { return "tc/" + deviceId + "/state"; }
String topicEstop()   { return "tc/" + deviceId + "/cmd/estop"; }
String topicConfig()  { return "tc/" + deviceId + "/cmd/camera/config"; }

volatile bool cameraEnabled = true;
bool microphoneEnabled = false;
bool microSdEnabled = false;
bool gpioEnabled = false;
bool cameraReady = false;
volatile uint8_t targetFps = DEFAULT_FPS;
bool syncInputEnabled = false;
bool wifiSleepEnabled = true;     // power-save allowed when no session is active
const char* frameSizeName = "VGA";

// ── Clock: esp_timer (monotonic) + SNTP-disciplined epoch mapping ────────────
struct ClockState {
  bool     synced = false;
  int64_t  offsetUs = 0;          // epoch_us = mono_us + offsetUs (as of last sync)
  int64_t  lastSyncMonoUs = 0;
  int64_t  lastCorrectionUs = 0;  // step applied at the most recent re-sync
  double   driftPpm = 0;          // informational: lastCorrection / interval
  uint32_t syncCount = 0;
};
static ClockState clk;
static portMUX_TYPE clockMux = portMUX_INITIALIZER_UNLOCKED;
static char ntpServer1[64] = {0};

static ClockState clockSnapshot() {
  portENTER_CRITICAL(&clockMux);
  ClockState c = clk;
  portEXIT_CRITICAL(&clockMux);
  return c;
}

// Runs in the lwIP task right after settimeofday(tv): tv is the new epoch.
static void onTimeSync(struct timeval* tv) {
  const int64_t mono = esp_timer_get_time();
  const int64_t epoch = (int64_t)tv->tv_sec * 1000000LL + tv->tv_usec;
  if (epoch < MIN_VALID_EPOCH_US) return;
  const int64_t newOffset = epoch - mono;
  portENTER_CRITICAL(&clockMux);
  if (clk.synced) {
    clk.lastCorrectionUs = newOffset - clk.offsetUs;
    const int64_t dt = mono - clk.lastSyncMonoUs;
    if (dt > 60LL * 1000000LL) clk.driftPpm = (double)clk.lastCorrectionUs * 1e6 / (double)dt;
  }
  clk.offsetUs = newOffset;
  clk.lastSyncMonoUs = mono;
  clk.synced = true;
  clk.syncCount++;
  portEXIT_CRITICAL(&clockMux);
}

void startClockSync() {
  // Prefer an explicit NTP server, then the LAN broker (a Pi running chrony is the
  // best local time source), then public pools. Pointers must outlive SNTP.
  String first = ntpServer.length() ? ntpServer : brokerIp;
  if (!first.length()) first = "pool.ntp.org";
  strlcpy(ntpServer1, first.c_str(), sizeof(ntpServer1));
  sntp_set_time_sync_notification_cb(onTimeSync);
  sntp_set_sync_mode(SNTP_SYNC_MODE_IMMED);   // step, so corrections are measurable
  sntp_set_sync_interval(SNTP_INTERVAL_MS);
  configTime(0, 0, ntpServer1, "pool.ntp.org", "time.google.com");
  Serial.printf("[TIME] SNTP via %s (+pool.ntp.org, time.google.com)\n", ntpServer1);
}

// ── Optional sync input (shared trigger wire) ────────────────────────────────
static std::atomic<uint32_t> triggerSeq{0};
static int64_t lastTriggerMonoUs = 0;
static portMUX_TYPE triggerMux = portMUX_INITIALIZER_UNLOCKED;

static void IRAM_ATTR onSyncEdge() {
  const int64_t now = esp_timer_get_time();
  portENTER_CRITICAL_ISR(&triggerMux);   // 64-bit store is not atomic on Xtensa
  lastTriggerMonoUs = now;
  triggerSeq.fetch_add(1, std::memory_order_relaxed);
  portEXIT_CRITICAL_ISR(&triggerMux);
}

static void triggerSnapshot(uint32_t& seq, int64_t& mono) {
  portENTER_CRITICAL(&triggerMux);
  seq = triggerSeq.load(std::memory_order_relaxed);
  mono = lastTriggerMonoUs;
  portEXIT_CRITICAL(&triggerMux);
}

void applySyncInput() {
  detachInterrupt(digitalPinToInterrupt(SYNC_IN_GPIO_NUM));
  if (syncInputEnabled) {
    pinMode(SYNC_IN_GPIO_NUM, INPUT_PULLDOWN);
    attachInterrupt(digitalPinToInterrupt(SYNC_IN_GPIO_NUM), onSyncEdge, RISING);
  } else {
    pinMode(SYNC_IN_GPIO_NUM, INPUT);  // high-impedance, untouched
  }
}

// ── Frame statistics (device-side) ───────────────────────────────────────────
static std::atomic<uint32_t> frameSeq{0};
static std::atomic<uint32_t> activeStreams{0};

// ── Wi-Fi power-save: on when idle, off while a session/audit is active ─────
// Modem sleep saves battery but adds 10-100+ ms latency jitter, so it is lifted
// only while timing matters: a /stream client is connected (the recorder is the
// only client) or a /time probe ran recently (pre-session audit, recorder offset
// estimation). Restored automatically once both have lapsed.
static std::atomic<int64_t> lowLatencyHoldUntilUs{0};
static SemaphoreHandle_t psMutex = NULL;
static bool psActive = true;               // power-save currently applied to the radio
static const char* psReason = "idle";

static void holdLowLatency(int64_t forUs) {
  const int64_t until = esp_timer_get_time() + forUs;
  int64_t cur = lowLatencyHoldUntilUs.load();
  while (until > cur && !lowLatencyHoldUntilUs.compare_exchange_weak(cur, until)) {}
}

// Safe from any task (loop, httpd handlers). Only touches the radio on a change.
void applyWifiPowerSave() {
  if (!psMutex) return;
  const char* reason = "idle";
  if (!wifiSleepEnabled) reason = "disabled";
  else if (activeStreams.load() > 0) reason = "stream";
  else if (esp_timer_get_time() < lowLatencyHoldUntilUs.load()) reason = "session_hold";
  const bool wantPs = strcmp(reason, "idle") == 0;
  xSemaphoreTake(psMutex, portMAX_DELAY);
  psReason = reason;
  if (wantPs != psActive) {
    WiFi.setSleep(wantPs);
    psActive = wantPs;
    Serial.printf("[NET] Wi-Fi power-save %s (%s)\n", wantPs ? "ON" : "OFF", reason);
  }
  xSemaphoreGive(psMutex);
}

// ── CORS: one configured browser origin for /stream and /status ──────────────
// Non-browser clients (recorder, relay/ffmpeg, timestamp_audit.py) ignore CORS.
// Blank corsOrigin = no Access-Control-Allow-Origin, so arbitrary web pages cannot
// read frames, headers or status. <img> display still works without CORS.
// corsOrigin (String) is written from the MQTT task; handlers read this copy under a
// lock into a caller-owned buffer (httpd keeps header pointers until they are sent).
static char corsOriginBuf[100] = {0};
static portMUX_TYPE corsMux = portMUX_INITIALIZER_UNLOCKED;

static void setCorsOrigin(const String& o) {
  corsOrigin = o;
  portENTER_CRITICAL(&corsMux);
  strlcpy(corsOriginBuf, o.c_str(), sizeof(corsOriginBuf));
  portEXIT_CRITICAL(&corsMux);
}

static void setRestrictedCors(httpd_req_t* req, char (&buf)[100], const char* exposeHeaders) {
  portENTER_CRITICAL(&corsMux);
  memcpy(buf, corsOriginBuf, sizeof(buf));
  portEXIT_CRITICAL(&corsMux);
  if (!buf[0]) return;
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", buf);
  httpd_resp_set_hdr(req, "Vary", "Origin");
  if (exposeHeaders) httpd_resp_set_hdr(req, "Access-Control-Expose-Headers", exposeHeaders);
}

static bool validCorsOrigin(const String& o) {
  if (!o.length()) return true;    // blank clears it
  if (o.length() > 96) return false;
  if (!o.startsWith("http://") && !o.startsWith("https://")) return false;
  if (o.endsWith("/")) return false;
  for (size_t i = 0; i < o.length(); i++) {
    const char ch = o[i];
    if (ch <= ' ' || ch == '"' || ch == ',' || ch == '*' || ch >= 0x7f) return false;
  }
  return o.indexOf('/', 8) < 0;    // scheme://host[:port] only, no path
}
static portMUX_TYPE statsMux = portMUX_INITIALIZER_UNLOCKED;
static int64_t lastCaptureMonoUs = 0;
static float   intervalEwmaUs = 0;
static float   ageEwmaUs = 0;       // capture -> handed to the network stack
static int64_t ageMaxUs = 0;
static uint32_t fbGetFailures = 0;
static uint32_t driverStampFallbacks = 0;

static void recordFrameStats(int64_t captureMono, int64_t sendMono) {
  portENTER_CRITICAL(&statsMux);
  if (lastCaptureMonoUs && captureMono > lastCaptureMonoUs) {
    const float iv = (float)(captureMono - lastCaptureMonoUs);
    intervalEwmaUs = intervalEwmaUs == 0 ? iv : intervalEwmaUs * 0.9f + iv * 0.1f;
  }
  lastCaptureMonoUs = captureMono;
  const int64_t age = sendMono - captureMono;
  ageEwmaUs = ageEwmaUs == 0 ? (float)age : ageEwmaUs * 0.9f + (float)age * 0.1f;
  if (age > ageMaxUs) ageMaxUs = age;
  portEXIT_CRITICAL(&statsMux);
}

// ── MJPEG stream handler (multipart/x-mixed-replace) ─────────────────────────
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";

static esp_err_t streamHandler(httpd_req_t* req) {
  if (!cameraEnabled || !cameraReady) {
    httpd_resp_set_status(req, "503 Service Unavailable");
    return httpd_resp_sendstr(req, cameraReady ? "Camera disabled in TenderCells" : "Camera not detected");
  }
  esp_err_t res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
  char cors[100];   // lives for the whole response
  setRestrictedCors(req, cors, "X-Frame-Seq, X-Capture-Epoch-Us");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store, no-cache, must-revalidate");
  activeStreams.fetch_add(1);
  applyWifiPowerSave();   // session started: radio to low-latency now, not on the next loop()
  char part[384];
  uint32_t streamSeq = 0;
  int64_t nextDueUs = esp_timer_get_time();
  while (cameraEnabled) {   // re-checked each frame: disabling stops live streams too
    // Pace to targetFps on a deadline (not a fixed sleep) so rate errors don't accumulate.
    const int64_t periodUs = 1000000LL / (targetFps ? targetFps : DEFAULT_FPS);
    int64_t now = esp_timer_get_time();
    if (now < nextDueUs) vTaskDelay(pdMS_TO_TICKS((nextDueUs - now + 999) / 1000));
    nextDueUs += periodUs;
    now = esp_timer_get_time();
    if (nextDueUs < now - periodUs) nextDueUs = now + periodUs;  // fell behind: resync, don't burst

    camera_fb_t* fb = esp_camera_fb_get();
    const int64_t getMono = esp_timer_get_time();
    if (!fb) { fbGetFailures++; res = ESP_FAIL; break; }
    int64_t capMono = (int64_t)fb->timestamp.tv_sec * 1000000LL + fb->timestamp.tv_usec;
    const char* stampSrc = "driver";
    if (capMono <= 0 || capMono > getMono || getMono - capMono > 2000000LL) {
      capMono = getMono;               // driver stamp missing/implausible
      stampSrc = "fb_get";
      driverStampFallbacks++;
    }
    const uint32_t seq = frameSeq.fetch_add(1) + 1;
    streamSeq++;
    const ClockState c = clockSnapshot();
    int n = snprintf(part, sizeof(part),
        "Content-Type: image/jpeg\r\nContent-Length: %u\r\n"
        "X-Frame-Seq: %lu\r\nX-Stream-Seq: %lu\r\n"
        "X-Capture-Mono-Us: %lld\r\nX-Capture-Stamp: %s\r\n"
        "X-Clock-Synced: %d\r\nX-Clock-Source: %s\r\n",
        (unsigned)fb->len, (unsigned long)seq, (unsigned long)streamSeq,
        (long long)capMono, stampSrc, c.synced ? 1 : 0, c.synced ? "sntp" : "none");
    if (c.synced && n > 0 && n < (int)sizeof(part)) {
      n += snprintf(part + n, sizeof(part) - n, "X-Capture-Epoch-Us: %lld\r\n",
                    (long long)(capMono + c.offsetUs));
    }
    if (syncInputEnabled && n > 0 && n < (int)sizeof(part)) {
      uint32_t tSeq; int64_t tMono;
      triggerSnapshot(tSeq, tMono);
      n += snprintf(part + n, sizeof(part) - n, "X-Trigger-Seq: %lu\r\nX-Trigger-Mono-Us: %lld\r\n",
                    (unsigned long)tSeq, (long long)tMono);
    }
    if (n > 0 && n < (int)sizeof(part) - 2) { part[n++] = '\r'; part[n++] = '\n'; }
    res  = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, part, n);
    recordFrameStats(capMono, esp_timer_get_time());
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    if (res != ESP_OK) break;  // client disconnected
  }
  holdLowLatency(STREAM_GRACE_US);   // reconnects / audit end-probes stay low-latency
  activeStreams.fetch_sub(1);
  return res;
}

static const char* resetReasonName(esp_reset_reason_t r) {
  switch (r) {
    case ESP_RST_POWERON:  return "poweron";
    case ESP_RST_SW:       return "software";
    case ESP_RST_PANIC:    return "panic";
    case ESP_RST_INT_WDT:  return "int_wdt";
    case ESP_RST_TASK_WDT: return "task_wdt";
    case ESP_RST_WDT:      return "wdt";
    case ESP_RST_DEEPSLEEP:return "deepsleep";
    case ESP_RST_BROWNOUT: return "brownout";   // battery/regulator sag under camera+Wi-Fi load
    default:               return "other";
  }
}

void fillClockJson(JsonObject o, const ClockState& c, int64_t mono) {
  o["synced"] = c.synced;
  o["source"] = c.synced ? "sntp" : "none";
  o["server"] = ntpServer1;
  o["monoUs"] = mono;
  if (c.synced) {
    o["epochUs"] = mono + c.offsetUs;
    o["offsetUs"] = c.offsetUs;               // epoch - monotonic mapping
    o["lastSyncAgeS"] = (mono - c.lastSyncMonoUs) / 1000000LL;
    o["lastCorrectionUs"] = c.lastCorrectionUs;
    o["driftPpm"] = c.driftPpm;
  }
  o["syncCount"] = c.syncCount;
  o["syncIntervalS"] = SNTP_INTERVAL_MS / 1000;
  // Wi-Fi SNTP is a single-sample, asymmetric-path estimate: expect a few ms, never <1 ms.
  o["expectedAccuracyMs"] = c.synced ? 5 : -1;
}

// Cheap probe for host-side NTP-style offset estimation (min-RTT filter).
static esp_err_t timeHandler(httpd_req_t* req) {
  holdLowLatency(TIME_PROBE_HOLD_US);   // an audit/recorder is starting: lift power-save
  applyWifiPowerSave();
  const int64_t mono = esp_timer_get_time();
  const ClockState c = clockSnapshot();
  char buf[160];
  int n = snprintf(buf, sizeof(buf), "{\"monoUs\":%lld,\"epochUs\":%lld,\"synced\":%s}",
                   (long long)mono, (long long)(c.synced ? mono + c.offsetUs : 0), c.synced ? "true" : "false");
  httpd_resp_set_type(req, "application/json");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  return httpd_resp_send(req, buf, n);
}

static esp_err_t statusHandler(httpd_req_t* req) {
  char cors[100];   // snapshot used for both the header and the JSON field
  setRestrictedCors(req, cors, NULL);
  const int64_t mono = esp_timer_get_time();
  const ClockState c = clockSnapshot();
  JsonDocument doc;
  doc["deviceId"] = deviceId;
  doc["node"] = "camera";
  doc["firmware"] = "camera-node";
  doc["uptimeS"] = mono / 1000000LL;
  doc["resetReason"] = resetReasonName(esp_reset_reason());
  fillClockJson(doc["clock"].to<JsonObject>(), c, mono);
  JsonObject cam = doc["camera"].to<JsonObject>();
  cam["ready"] = cameraReady;
  cam["enabled"] = (bool)cameraEnabled;
  cam["frameSize"] = frameSizeName;
  cam["targetFps"] = targetFps;
  cam["fbCount"] = psramFound() ? 2 : 1;
  cam["fbInPsram"] = psramFound();
  cam["grabMode"] = "latest";
  cam["activeStreams"] = activeStreams.load();
  cam["frameSeq"] = frameSeq.load();
  cam["fbGetFailures"] = fbGetFailures;
  cam["driverStampFallbacks"] = driverStampFallbacks;
  portENTER_CRITICAL(&statsMux);
  const float iv = intervalEwmaUs, age = ageEwmaUs;
  const int64_t ageMax = ageMaxUs;
  portEXIT_CRITICAL(&statsMux);
  cam["measuredFps"] = iv > 0 ? 1e6f / iv : 0;
  cam["captureToSendMsEwma"] = age / 1000.0f;
  cam["captureToSendMsMax"] = ageMax / 1000.0;
  JsonObject sync = doc["syncInput"].to<JsonObject>();
  sync["enabled"] = syncInputEnabled;
  sync["pin"] = "D3/GPIO4";
  uint32_t tSeq; int64_t tMono;
  triggerSnapshot(tSeq, tMono);
  sync["edges"] = tSeq;
  sync["lastEdgeMonoUs"] = (long long)tMono;
  sync["exposureTrigger"] = false;   // sensor free-runs; edges are timestamped only
  JsonObject net_ = doc["network"].to<JsonObject>();
  net_["rssi"] = WiFi.RSSI();
  net_["wifiSleep"] = wifiSleepEnabled;          // setting: power-save allowed when idle
  net_["wifiPowerSaveActive"] = psActive;        // what the radio is doing now
  net_["wifiPowerSaveReason"] = psReason;        // idle | stream | session_hold | disabled
  net_["corsOrigin"] = (const char*)cors;
  net_["mqttConnected"] = mqtt.connected();
  JsonObject mem = doc["memory"].to<JsonObject>();
  mem["freeHeap"] = ESP.getFreeHeap();
  mem["psramSize"] = ESP.getPsramSize();
  mem["freePsram"] = ESP.getFreePsram();
  String out;
  serializeJson(doc, out);
  httpd_resp_set_type(req, "application/json");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  return httpd_resp_send(req, out.c_str(), out.length());
}

void startStreamServer() {
  if (streamServer) return;
  // esp_http_server runs one task per instance and the stream handler never returns
  // while a client watches, so status/time live on a second instance (:81) to stay
  // reachable during streaming. One stream client at a time on :80.
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;
  config.ctrl_port = 32768;
  config.lru_purge_enable = true;
  config.max_open_sockets = 4;
  config.send_wait_timeout = 5;
  httpd_uri_t uri = { .uri = "/stream", .method = HTTP_GET, .handler = streamHandler, .user_ctx = NULL };
  if (httpd_start(&streamServer, &config) == ESP_OK) {
    httpd_register_uri_handler(streamServer, &uri);
    Serial.println("[CAM] MJPEG server on :80/stream");
  } else {
    streamServer = NULL;
    Serial.println("[CAM] failed to start stream server");
  }
  httpd_config_t sc = HTTPD_DEFAULT_CONFIG();
  sc.server_port = 81;
  sc.ctrl_port = 32769;
  sc.max_open_sockets = 3;
  sc.lru_purge_enable = true;
  sc.stack_size = 6144;   // ArduinoJson status document
  httpd_uri_t st = { .uri = "/status", .method = HTTP_GET, .handler = statusHandler, .user_ctx = NULL };
  httpd_uri_t tm = { .uri = "/time", .method = HTTP_GET, .handler = timeHandler, .user_ctx = NULL };
  if (httpd_start(&statusServer, &sc) == ESP_OK) {
    httpd_register_uri_handler(statusServer, &st);
    httpd_register_uri_handler(statusServer, &tm);
    Serial.println("[CAM] status on :81/status, :81/time");
  } else {
    statusServer = NULL;
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
  // VGA keeps JPEG size and Wi-Fi airtime modest so latency stays bounded.
  c.frame_size   = psramFound() ? FRAMESIZE_VGA : FRAMESIZE_QVGA;
  frameSizeName  = psramFound() ? "VGA" : "QVGA";
  c.jpeg_quality = 12;
  c.fb_count     = psramFound() ? 2 : 1;
  c.fb_location  = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode    = CAMERA_GRAB_LATEST;   // newest frame, never a stale queue
  esp_err_t err = esp_camera_init(&c);
  if (err != ESP_OK) { Serial.printf("[CAM] init failed 0x%x\n", err); return false; }
  return true;
}

void publishHeartbeat() {
  JsonDocument doc;
  const ClockState c = clockSnapshot();
  doc["node"]        = "camera";
  doc["productType"] = productType;
  doc["peripheral"]  = "camera";
  doc["streamUrl"]   = "http://" + WiFi.localIP().toString() + "/stream";
  doc["statusUrl"]   = "http://" + WiFi.localIP().toString() + ":81/status";
  doc["cameraEnabled"] = (bool)cameraEnabled;
  doc["microphoneEnabled"] = microphoneEnabled;
  doc["microSdEnabled"] = microSdEnabled;
  doc["gpioEnabled"] = gpioEnabled;
  doc["fps"]         = targetFps;
  doc["frameSize"]   = frameSizeName;
  doc["clockSynced"] = c.synced;
  if (c.synced) doc["epochMs"] = (esp_timer_get_time() + c.offsetUs) / 1000LL;
  doc["resetReason"] = resetReasonName(esp_reset_reason());
  doc["rssi"]        = WiFi.RSSI();
  doc["ts"]          = millis();   // unchanged: uptime ms (compat). Use epochMs for wall time.
  char buf[640];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (!mqtt.publish(topicSensors().c_str(), (const uint8_t*)buf, n)) {
    Serial.println("[MQTT] heartbeat publish failed");
  }
}

void publishState(const char* s) {
  JsonDocument doc;
  doc["state"] = s; doc["ts"] = millis();
  char buf[128]; size_t n = serializeJson(doc, buf, sizeof(buf));
  mqtt.publish(topicState().c_str(), (const uint8_t*)buf, n, strcmp(s, "estop") == 0);
}

void onMqtt(char* topic, byte* payload, unsigned int len) {
  JsonDocument doc;
  if (deserializeJson(doc, payload, len)) return;
  if (String(topic) == topicEstop()) {
    eStopActive = doc["active"] | false;
    publishState(eStopActive ? "estop" : "idle");
  } else if (String(topic) == topicConfig()) {
    prefs.begin("tccam", false);
    // Only touch capabilities when the message carries them: a config that only sets
    // fps must not silently disable the camera.
    if (doc["enabled"].is<JsonArray>()) {
      JsonArray enabled = doc["enabled"].as<JsonArray>();
      cameraEnabled = false;
      microphoneEnabled = false;
      microSdEnabled = false;
      gpioEnabled = false;
      for (JsonVariant value : enabled) {
        const char* capability = value.as<const char*>();
        if (!capability) continue;
        if (strcmp(capability, "camera") == 0) cameraEnabled = true;
        else if (strcmp(capability, "microphone") == 0) microphoneEnabled = true;
        else if (strcmp(capability, "microsd") == 0) microSdEnabled = true;
        else if (strcmp(capability, "gpio") == 0) gpioEnabled = true;
      }
      prefs.putBool("camera", cameraEnabled);
      prefs.putBool("microphone", microphoneEnabled);
      prefs.putBool("microsd", microSdEnabled);
      prefs.putBool("gpio", gpioEnabled);
    }
    if (doc["fps"].is<int>()) {
      int fps = doc["fps"].as<int>();
      if (fps >= 1 && fps <= MAX_FPS) { targetFps = (uint8_t)fps; prefs.putUChar("fps", targetFps); }
    }
    if (doc["syncInput"].is<bool>()) {
      syncInputEnabled = doc["syncInput"].as<bool>();
      prefs.putBool("syncIn", syncInputEnabled);
      applySyncInput();
    }
    if (doc["wifiSleep"].is<bool>()) {   // true (default) = power-save when idle; false = always off
      wifiSleepEnabled = doc["wifiSleep"].as<bool>();
      prefs.putBool("wifiSleep", wifiSleepEnabled);
      applyWifiPowerSave();
    }
    if (doc["corsOrigin"].is<const char*>()) {
      String o = doc["corsOrigin"].as<const char*>();
      o.trim();
      if (validCorsOrigin(o)) { setCorsOrigin(o); prefs.putString("cors", corsOrigin); }
      else Serial.println("[NET] corsOrigin rejected (use scheme://host[:port], no path)");
    }
    prefs.end();
    publishHeartbeat();
    publishState("configured");
  }
}

bool reconnect() {
  if (brokerIp.isEmpty() || WiFi.status() != WL_CONNECTED) return false;
  String id = "tc-cam-" + deviceId + "-" + String((uint32_t)esp_random(), HEX);
  if (mqtt.connect(id.c_str())) {
    mqtt.subscribe(topicEstop().c_str(), 1);
    mqtt.subscribe(topicConfig().c_str(), 1);
    publishState("idle");
    return true;
  }
  return false;
}

bool tryUsbProvision() {
  Serial.println("[USB] Send TC_SCAN or TC_PROVISION JSON within 10 seconds, or use the TenderCam-Setup Wi-Fi");
  unsigned long deadline = millis() + 10000;
  while (millis() < deadline) {
    if (!Serial.available()) { delay(25); continue; }
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line == "TC_SCAN") {
      WiFi.mode(WIFI_STA);
      int count = WiFi.scanNetworks(false, true, false, 300, 0);
      JsonDocument networks;
      JsonArray results = networks.to<JsonArray>();
      for (int i = 0; i < count; i++) {
        if (WiFi.SSID(i).isEmpty()) continue;
        JsonObject network = results.add<JsonObject>();
        network["ssid"] = WiFi.SSID(i);
        network["rssi"] = WiFi.RSSI(i);
        network["secure"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
      }
      Serial.print("[USB] NETWORKS:");
      serializeJson(networks, Serial);
      Serial.println();
      WiFi.scanDelete();
      deadline = millis() + 10000;
      continue;
    }
    if (!line.startsWith("TC_PROVISION:")) continue;

    JsonDocument doc;
    if (deserializeJson(doc, line.substring(13)) != DeserializationError::Ok) {
      Serial.println("[USB] ERROR invalid provisioning message");
      continue;
    }
    line = "";
    String ssid = doc["ssid"] | "";
    String password = doc["password"] | "";
    String requestedDeviceId = doc["deviceId"] | "";
    String requestedBroker = doc["broker"] | "";
    if (ssid.isEmpty()) {
      Serial.println("[USB] ERROR SSID is required");
      continue;
    }

    Serial.printf("[USB] Connecting to %s (password not logged)\n", ssid.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());
    unsigned long connectDeadline = millis() + 20000;
    while (WiFi.status() != WL_CONNECTED && millis() < connectDeadline) delay(250);
    password = "";
    doc.clear();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[USB] ERROR Wi-Fi connection failed");
      return false;
    }
    if (!requestedDeviceId.isEmpty()) deviceId = requestedDeviceId;
    if (!requestedBroker.isEmpty()) brokerIp = requestedBroker;
    prefs.putString("deviceId", deviceId);
    prefs.putString("brokerIp", brokerIp);
    Serial.printf("[USB] CONNECTED ip=%s deviceId=%s\n", WiFi.localIP().toString().c_str(), deviceId.c_str());
    return true;
  }
  return false;
}

// Setup AP password: WPA2, per device. A 64-bit random secret is generated once
// (first boot) and kept in NVS; the password is derived from it as 12 Crockford
// base32 characters in groups of four (60 bits), e.g. "7k2m-x9qa-4dfr". It survives
// re-flashing; only an NVS/flash erase makes a new one (re-print the label).
String setupApPassword() {
  static const char* ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";  // no i l o u
  uint8_t secret[8] = {0};
  bool have = prefs.isKey("apSecret") && prefs.getBytes("apSecret", secret, sizeof(secret)) == sizeof(secret);
  if (!have) {
    // esp_random() is a true RNG only while the RF subsystem runs: start STA first.
    WiFi.mode(WIFI_STA);
    delay(10);
    esp_fill_random(secret, sizeof(secret));
    prefs.putBytes("apSecret", secret, sizeof(secret));
    Serial.println("[NET] generated new setup Wi-Fi secret (first boot)");
  }
  uint64_t v = 0;
  memcpy(&v, secret, sizeof(v));
  char out[16];
  int j = 0;
  for (int i = 0; i < 12; i++) {
    if (i && i % 4 == 0) out[j++] = '-';
    out[j++] = ALPHABET[v & 31];
    v >>= 5;
  }
  out[j] = 0;
  return String(out);
}

void provision() {
  prefs.begin("tccam", false);
  brokerIp    = prefs.getString("brokerIp", "");
  brokerPort  = prefs.getString("brokerPort", "1883");
  deviceId    = prefs.getString("deviceId", "");
  productType = prefs.getString("product", "camera-kit");
  ntpServer   = prefs.getString("ntp", "");
  {
    String o = prefs.getString("cors", "");
    setCorsOrigin(validCorsOrigin(o) ? o : String());
  }
  cameraEnabled = prefs.getBool("camera", true);
  microphoneEnabled = prefs.getBool("microphone", false);
  microSdEnabled = prefs.getBool("microsd", false);
  gpioEnabled = prefs.getBool("gpio", false);
  targetFps = prefs.getUChar("fps", DEFAULT_FPS);
  if (targetFps < 1 || targetFps > MAX_FPS) targetFps = DEFAULT_FPS;
  syncInputEnabled = prefs.getBool("syncIn", false);
  wifiSleepEnabled = prefs.getBool("wifiSleep", true);
  if (deviceId.isEmpty()) {
    uint64_t mac = ESP.getEfuseMac();
    char b[24]; snprintf(b, sizeof(b), "cam_%04X", (uint16_t)(mac & 0xFFFF));
    deviceId = b;
  }
  const String apPassword = setupApPassword();
  // Printed every boot so it can be read back over USB serial and copied to the label.
  Serial.printf("[NET] setup Wi-Fi: %s  password: %s\n", SETUP_AP_SSID, apPassword.c_str());
  bool usbConnected = tryUsbProvision();
  WiFiManager wm;
  WiFiManagerParameter pB("broker", "Broker IP (blank = auto)", brokerIp.c_str(), 40);
  WiFiManagerParameter pP("port", "Broker port", brokerPort.c_str(), 6);
  WiFiManagerParameter pI("devid", "Device ID", deviceId.c_str(), 22);
  WiFiManagerParameter pT("product", "Product type", productType.c_str(), 20);
  WiFiManagerParameter pN("ntp", "NTP server (blank = broker, then pool)", ntpServer.c_str(), 40);
  WiFiManagerParameter pC("cors", "UI/relay origin for browser reads (blank = none)", corsOrigin.c_str(), 96);
  wm.addParameter(&pB); wm.addParameter(&pP); wm.addParameter(&pI); wm.addParameter(&pT);
  wm.addParameter(&pN); wm.addParameter(&pC);
  if (!usbConnected) {
    // Already-provisioned nodes must not sit in an open setup AP forever when the
    // router is merely slow to come back after a power cut: time out and reboot.
    const bool saved = wm.getWiFiIsSaved();
    wm.setConfigPortalTimeout(saved ? PORTAL_TIMEOUT_SAVED_S : 0);
    if (!wm.autoConnect(SETUP_AP_SSID, apPassword.c_str())) {   // WPA2, per-device password
      Serial.println("[NET] Wi-Fi unavailable and portal timed out — rebooting to retry");
      prefs.end();
      delay(500);
      ESP.restart();
    }
    // Only overwrite stored settings when the portal actually ran (fields are
    // pre-filled with the stored values, so this is a no-op otherwise).
    brokerIp = pB.getValue(); brokerPort = pP.getValue();
    deviceId = pI.getValue(); productType = pT.getValue();
    ntpServer = pN.getValue();
    String o = pC.getValue(); o.trim();
    if (validCorsOrigin(o)) setCorsOrigin(o);
  }
  if (productType.isEmpty()) productType = "camera-kit";
  prefs.putString("brokerIp", brokerIp); prefs.putString("brokerPort", brokerPort);
  prefs.putString("deviceId", deviceId); prefs.putString("product", productType);
  prefs.putString("ntp", ntpServer);
  prefs.putString("cors", corsOrigin);
  prefs.end();
}

void startMdns() {
  if (mdnsStarted || WiFi.status() != WL_CONNECTED) return;
  if (MDNS.begin(deviceId.c_str())) {   // http://<deviceId>.local/stream
    MDNS.addService("http", "tcp", 80);
    mdnsStarted = true;
  }
}

void discoverBroker() {
  if (brokerIp.length() || WiFi.status() != WL_CONNECTED) return;
  startMdns();
  if (!mdnsStarted) return;
  if (MDNS.queryService("mqtt", "tcp") > 0) {
    brokerIp = MDNS.IP(0).toString(); brokerPort = String(MDNS.port(0));
    uint16_t port = (uint16_t)brokerPort.toInt(); if (!port) port = 1883;
    mqtt.setServer(brokerIp.c_str(), port);   // PubSubClient keeps the pointer: brokerIp is global
    Serial.printf("[NET] broker discovered %s:%u\n", brokerIp.c_str(), port);
  }
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println("\n=== Tender Cells Camera Node ===");
  Serial.printf("[SYS] reset reason: %s\n", resetReasonName(esp_reset_reason()));
  cameraReady = initCamera();
  if (!cameraReady) Serial.println("[CAM] no camera — check board/ribbon");

  provision();
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  psMutex = xSemaphoreCreateMutex();
  psActive = true;
  WiFi.setSleep(true);   // battery default; lifted automatically during sessions/audits
  applyWifiPowerSave();  // honours {"wifiSleep":false} (always low-latency)
  applySyncInput();
  startMdns();

  uint16_t port = (uint16_t)brokerPort.toInt(); if (!port) port = 1883;
  mqtt.setBufferSize(1024);  // default 256 B truncated/dropped the heartbeat
  mqtt.setCallback(onMqtt);
  mqtt.setSocketTimeout(4);
  if (brokerIp.length()) mqtt.setServer(brokerIp.c_str(), port);
  discoverBroker();
  lastBrokerDiscovery = millis();
  startClockSync();
  if (WiFi.status() == WL_CONNECTED) startStreamServer();

  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  Serial.printf("[NET] stream: http://%s/stream  status: http://%s:81/status  fps=%u  cors=%s\n",
                WiFi.localIP().toString().c_str(), WiFi.localIP().toString().c_str(), targetFps,
                corsOrigin.length() ? corsOrigin.c_str() : "(none)");
}

void loop() {
  esp_task_wdt_reset();
  applyWifiPowerSave();   // restores power-save once the session/audit hold lapses
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiReconnect > WIFI_RECONNECT_MS) {
    lastWifiReconnect = millis();
    WiFi.reconnect();
  }
  if (WiFi.status() == WL_CONNECTED) {
    startMdns();
    startStreamServer();   // no-op once running
    if (brokerIp.isEmpty() && millis() - lastBrokerDiscovery > BROKER_DISCOVERY_MS) {
      lastBrokerDiscovery = millis();
      discoverBroker();
      esp_task_wdt_reset();
    }
  }
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
