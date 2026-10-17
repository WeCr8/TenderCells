// TenderCells CT72 cell-IO node - rev A1.2 (2026-10-16)
// - 30 Hz camera trigger on one line; every rising edge is stamped (esp_timer us) with a sequence number and
//   reported to the host, which maps it onto the shared cell clock (ct72/timing.py DeviceClockSync).
// - Roost bars A/B: 12 V linear actuators via DRV8874. A move starts ONLY if the E-stop chain is closed and the
//   bar's load cells read <= tare + 0.3 kg; it stops on a load rise, an over-current (pinch/stall) before the
//   limit switch, a 20 s timeout or an E-stop (a move always ends at a limit switch, the
//   timeout or a fault, so a host crash mid-move is safe). Position = limit switches only.
// - Nest lid actuator (reed switch confirms open), Starter vacuum tool (pump + valve + pressure limit).
// Host protocol (USB-CDC, one JSON object per line):  {"cmd":"status"} {"cmd":"roost","bar":"A","to":"stowed"}
//   {"cmd":"lid","to":"open"} {"cmd":"trigger","hz":30} {"cmd":"sync"} {"cmd":"tare"} {"cmd":"vac","on":true}
//   {"cmd":"hb"}   -> replies {"ok":true,...} or {"ok":false,"err":"..."}; trigger edges stream as {"trg":seq,"us":t}
#include <Arduino.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_ADS1X15.h>
#include <HX711.h>
#include "esp_timer.h"
#include "pins.h"

// ---------------------------------------------------------------- limits
static const float EMPTY_KG = 0.30f;          // bird detection threshold above tare
static const float LOAD_RISE_KG = 0.30f;      // abort if load rises this much during a move
static const float OVERCURRENT_A = 2.0f;      // DRV8874 continuous ~2.1 A; actuator free-run ~0.6-1 A (measure)
static const uint32_t MOVE_TIMEOUT_MS = 20000;
static const uint8_t MOVE_DUTY = 150;         // ~60 % -> slow bar motion; soft-start ramp below
static const float VAC_LIMIT_KPA = 20.0f;

Adafruit_MCP23X17 mcp;
Adafruit_ADS1115 ads;
HX711 hxA, hxB;
bool mcpOk = false, adsOk = false;

// ---------------------------------------------------------------- camera trigger + edge stamps
static esp_timer_handle_t trigTimer, trigOffTimer;
static volatile uint32_t trigSeq = 0;
static volatile int64_t trigUs[64];
static volatile uint32_t trigHead = 0, trigTail = 0;
static uint32_t trigHz = 0;

static void IRAM_ATTR trigOff(void*) { digitalWrite(PIN_CAM_TRIGGER, LOW); }
static void IRAM_ATTR trigOn(void*) {
  int64_t t = esp_timer_get_time();
  digitalWrite(PIN_CAM_TRIGGER, HIGH);
  trigUs[trigHead & 63] = t; trigHead++; trigSeq++;
  esp_timer_start_once(trigOffTimer, 1000);        // 1 ms pulse
}
static void setTrigger(uint32_t hz) {
  esp_timer_stop(trigTimer);
  trigHz = hz;
  if (hz) esp_timer_start_periodic(trigTimer, 1000000ULL / hz);
}

// ---------------------------------------------------------------- roost state machine
enum RoostPos { POS_UNKNOWN, POS_DEPLOYED, POS_STOWED, POS_MOVING, POS_FAULT };
struct Bar {
  const char* name; uint8_t en, ph, limDep, limStow, adsCh; HX711* hx;
  float tareKg, loadKg, startLoad; RoostPos pos, target; uint32_t t0; char fault[48];
  Bar(const char* n, uint8_t e, uint8_t p, uint8_t ld, uint8_t ls, uint8_t ch, HX711* h)
      : name(n), en(e), ph(p), limDep(ld), limStow(ls), adsCh(ch), hx(h), tareKg(0), loadKg(0), startLoad(0),
        pos(POS_UNKNOWN), target(POS_UNKNOWN), t0(0) { fault[0] = 0; }
};
static Bar roostBars[2] = {
  Bar("A", PIN_EN_ROOST_A, MCP_PH_ROOST_A, MCP_LIM_A_DEPLOYED, MCP_LIM_A_STOWED, 0, &hxA),
  Bar("B", PIN_EN_ROOST_B, MCP_PH_ROOST_B, MCP_LIM_B_DEPLOYED, MCP_LIM_B_STOWED, 1, &hxB),
};
static float hxScale = 21000.0f;     // counts per kg - calibrate with a known weight (README)
uint32_t lastHb = 0;

bool estopOk() { return digitalRead(PIN_ESTOP_OK) == HIGH; }
bool lim(uint8_t p) { return mcpOk && mcp.digitalRead(p) == LOW; }   // NO switches to GND, pulled up
float ampsOf(uint8_t ch) { return adsOk ? ads.computeVolts(ads.readADC_SingleEnded(ch)) * IPROPI_A_PER_V : 0.0f; }

void readPos(Bar& b) {
  if (b.pos == POS_MOVING || b.pos == POS_FAULT) return;
  bool d = lim(b.limDep), s = lim(b.limStow);
  b.pos = (d && !s) ? POS_DEPLOYED : (s && !d) ? POS_STOWED : POS_UNKNOWN;
}
void stopBar(Bar& b) { analogWrite(b.en, 0); }
void allStop() { for (auto& b : roostBars) { stopBar(b); if (b.pos == POS_MOVING) b.pos = POS_UNKNOWN; } analogWrite(PIN_EN_LID, 0); analogWrite(PIN_PUMP_PWM, 0); }
void faultBar(Bar& b, const char* why) { stopBar(b); b.pos = POS_FAULT; strncpy(b.fault, why, sizeof(b.fault) - 1); }

const char* startMove(Bar& b, RoostPos to) {
  if (!estopOk()) return "estop";
  if (b.pos == POS_FAULT) return b.fault;
  if (b.loadKg - b.tareKg > EMPTY_KG) return "occupied";
  readPos(b);
  if (b.pos == to) return nullptr;            // already there
  b.target = to; b.startLoad = b.loadKg; b.t0 = millis(); b.pos = POS_MOVING; lastHb = millis();
  mcp.digitalWrite(MCP_NSLEEP, HIGH);
  mcp.digitalWrite(b.ph, to == POS_STOWED ? HIGH : LOW);
  return nullptr;
}

void serviceBar(Bar& b) {
  if (b.pos != POS_MOVING) return;
  uint32_t el = millis() - b.t0;
  uint8_t duty = el < 500 ? (uint8_t)(MOVE_DUTY * el / 500) : MOVE_DUTY;   // soft start
  bool done = (b.target == POS_STOWED) ? lim(b.limStow) : lim(b.limDep);
  if (done) { stopBar(b); b.pos = b.target; return; }
  if (!estopOk()) { faultBar(b, "estop during move"); return; }
  if (el > MOVE_TIMEOUT_MS) { faultBar(b, "timeout - limit switch not reached"); return; }
  if (b.loadKg - b.startLoad > LOAD_RISE_KG) { faultBar(b, "load rose - bird?"); return; }
  if (el > 600 && ampsOf(b.adsCh) > OVERCURRENT_A) { faultBar(b, "over-current - pinch/stall"); return; }
  analogWrite(b.en, duty);
}

// ---------------------------------------------------------------- lid + vacuum
const char* moveLid(bool open) {
  if (!estopOk()) return "estop";
  mcp.digitalWrite(MCP_NSLEEP, HIGH);
  mcp.digitalWrite(MCP_PH_LID, open ? HIGH : LOW);
  uint32_t t0 = millis();
  analogWrite(PIN_EN_LID, MOVE_DUTY);
  while (millis() - t0 < 8000) {                 // actuator's internal limit switch ends travel
    if (!estopOk()) { analogWrite(PIN_EN_LID, 0); return "estop"; }
    if (millis() - t0 > 600 && ampsOf(2) > OVERCURRENT_A) { analogWrite(PIN_EN_LID, 0); return "lid over-current"; }
    if (open && lim(MCP_LID_OPEN_REED)) break;
    delay(10);
  }
  analogWrite(PIN_EN_LID, 0);
  if (open && !lim(MCP_LID_OPEN_REED)) return "lid open not confirmed";
  return nullptr;
}
float vacKpa() { return adsOk ? (ads.computeVolts(ads.readADC_SingleEnded(3)) - 0.5f) * (100.0f / 4.0f) : 0.0f; }  // XGZP6847A -100..0 kPa, 0.5-4.5 V (via divider: verify)

// ---------------------------------------------------------------- host protocol
void reply(JsonDocument& d) { serializeJson(d, Serial); Serial.print('\n'); }

void handle(const char* line) {
  JsonDocument in, out;
  if (deserializeJson(in, line)) { out["ok"] = false; out["err"] = "bad json"; reply(out); return; }
  const char* c = in["cmd"] | "";
  lastHb = millis();
  out["ok"] = true;
  if (!strcmp(c, "status") || !strcmp(c, "hb")) {
    out["estop_ok"] = estopOk(); out["trigger_hz"] = trigHz; out["seq"] = trigSeq;
    for (auto& b : roostBars) {
      readPos(b);
      JsonObject o = out["bars"][b.name].to<JsonObject>();
      const char* p[] = {"unknown", "deployed", "stowed", "moving", "fault"};
      o["pos"] = p[b.pos]; o["load_kg"] = b.loadKg; o["tare_kg"] = b.tareKg; o["fault"] = b.fault;
    }
    out["lid_open"] = lim(MCP_LID_OPEN_REED);
  } else if (!strcmp(c, "roost")) {
    Bar* b = (in["bar"] == "A") ? &roostBars[0] : (in["bar"] == "B") ? &roostBars[1] : nullptr;
    RoostPos to = (in["to"] == "stowed") ? POS_STOWED : POS_DEPLOYED;
    const char* err = b ? startMove(*b, to) : "bad bar";
    if (err) { out["ok"] = false; out["err"] = err; reply(out); return; }
    while (b->pos == POS_MOVING) { b->loadKg = b->hx->is_ready() ? b->hx->get_units(1) : b->loadKg; serviceBar(*b); delay(5); }
    const char* p[] = {"unknown", "deployed", "stowed", "moving", "fault"};
    out["ok"] = b->pos == to; out["pos"] = p[b->pos]; if (b->pos == POS_FAULT) out["err"] = b->fault;
  } else if (!strcmp(c, "lid")) {
    const char* err = moveLid(in["to"] == "open");
    if (err) { out["ok"] = false; out["err"] = err; }
    out["lid"] = lim(MCP_LID_OPEN_REED) ? "open" : "closed";
  } else if (!strcmp(c, "trigger")) {
    setTrigger(in["hz"] | 0); out["hz"] = trigHz;
  } else if (!strcmp(c, "sync")) {
    out["us"] = (int64_t)esp_timer_get_time();     // host stamps send/receive around this (4-timestamp sync)
  } else if (!strcmp(c, "tare")) {
    for (auto& b : roostBars) { b.hx->tare(10); b.tareKg = 0; strcpy(b.fault, ""); if (b.pos == POS_FAULT) b.pos = POS_UNKNOWN; }
  } else if (!strcmp(c, "vac")) {
    bool on = in["on"] | false;
    if (on && !estopOk()) { out["ok"] = false; out["err"] = "estop"; reply(out); return; }
    mcp.digitalWrite(MCP_VAC_VALVE, on ? LOW : HIGH);    // NC valve: energise = vent
    analogWrite(PIN_PUMP_PWM, on ? 200 : 0);
    delay(on ? 400 : 100);
    float k = vacKpa(); out["kpa"] = k; out["seal"] = on && (-k) > 8.0f;
    if (on && (-k) > VAC_LIMIT_KPA) analogWrite(PIN_PUMP_PWM, 90);   // hold, don't exceed the egg-safe limit
  } else {
    out["ok"] = false; out["err"] = "unknown cmd";
  }
  reply(out);
}

void setup() {
  Serial.begin(921600);
  pinMode(PIN_CAM_TRIGGER, OUTPUT); digitalWrite(PIN_CAM_TRIGGER, LOW);
  pinMode(PIN_ESTOP_OK, INPUT_PULLDOWN);
  for (uint8_t p : {PIN_EN_ROOST_A, PIN_EN_ROOST_B, PIN_EN_LID, PIN_PUMP_PWM}) { pinMode(p, OUTPUT); analogWrite(p, 0); }
  Wire.begin(PIN_SDA, PIN_SCL);
  mcpOk = mcp.begin_I2C(0x20);
  if (mcpOk) {
    for (uint8_t p : {MCP_PH_ROOST_A, MCP_PH_ROOST_B, MCP_PH_LID, MCP_NSLEEP, MCP_VAC_VALVE}) mcp.pinMode(p, OUTPUT);
    for (uint8_t p : {MCP_LIM_A_DEPLOYED, MCP_LIM_A_STOWED, MCP_LIM_B_DEPLOYED, MCP_LIM_B_STOWED, MCP_LID_OPEN_REED, MCP_TOOL_CONTACT}) mcp.pinMode(p, INPUT_PULLUP);
    mcp.digitalWrite(MCP_NSLEEP, LOW);
  }
  adsOk = ads.begin(0x48);
  hxA.begin(PIN_HX_DOUT_A, PIN_HX_SCK); hxB.begin(PIN_HX_DOUT_B, PIN_HX_SCK);
  hxA.set_scale(hxScale); hxB.set_scale(hxScale);
  esp_timer_create_args_t a = {}; a.callback = trigOn; a.name = "trg"; esp_timer_create(&a, &trigTimer);
  esp_timer_create_args_t b = {}; b.callback = trigOff; b.name = "trgoff"; esp_timer_create(&b, &trigOffTimer);
}

static char buf[256]; static size_t n = 0;
void loop() {
  if (!estopOk()) allStop();
  for (auto& b : roostBars) if (b.hx->is_ready()) b.loadKg = b.hx->get_units(1);
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n') { buf[n] = 0; if (n) handle(buf); n = 0; }
    else if (n < sizeof(buf) - 1) buf[n++] = ch;
  }
  while (trigTail != trigHead) {                       // stream trigger edge stamps
    Serial.printf("{\"trg\":%lu,\"us\":%lld}\n", (unsigned long)(trigSeq - (trigHead - trigTail) + 1), (long long)trigUs[trigTail & 63]);
    trigTail++;
  }
}
