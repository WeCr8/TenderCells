diff --git a/firmware/starter-node/src/main.cpp b/firmware/starter-node/src/main.cpp
index 53d7817..0c011cd 100644
--- a/firmware/starter-node/src/main.cpp
+++ b/firmware/starter-node/src/main.cpp
@@ -369,7 +369,7 @@ void sendOut(const char* mqttTopic, JsonDocument& doc, bool retain) {
 
 // ── Publish current state (retained when E-STOP, like the coop controller) ───
 void publishState(const char* state) {
-  StaticJsonDocument<256> doc;
+  JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
   doc["state"]    = state;
   doc["uptime"]   = millis() / 1000;
   doc["freeHeap"] = ESP.getFreeHeap();
@@ -384,7 +384,7 @@ void publishState(const char* state) {
 
 // ── Heartbeat as a sensors payload so it renders on the dashboard ────────────
 void publishHeartbeat() {
-  StaticJsonDocument<192> doc;
+  JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
   // Starter Node has no real sensors — report a harmless, obviously-fake set so
   // it is visibly distinguishable from a real coop while still exercising the path.
   // Real readings when a sensor peripheral is attached; 0 otherwise. Average 3
@@ -428,7 +428,7 @@ void publishHeartbeat() {
 // exactly like a real predator detection. Same alert schema the platform uses.
 void publishThreat() {
   if (!meshOnly && !mqtt.connected()) return;
-  StaticJsonDocument<192> doc;
+  JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
   doc["type"]       = threatLabel.length() ? threatLabel : String("predator");
   doc["species"]    = species;
   doc["confidence"] = 1.0;        // manual trigger = certain
@@ -497,7 +497,7 @@ void applyCommand(const String& kind, JsonDocument& doc) {
 
 // A directed mesh command addressed to us (poll() already filtered dest==_addr).
 void handleMeshCommand(const uint8_t* payload, uint8_t len) {
-  StaticJsonDocument<200> doc;
+  JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
   if (deserializeJson(doc, payload, len)) return;
   String kind = doc["topic"] | "";
   if (kind.length()) applyCommand(kind, doc);
@@ -514,7 +514,7 @@ void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload,
   switch (type) {
     case TC_MSG_HEARTBEAT: {
       if (!mqtt.connected()) break;  // nothing to bridge onto
-      StaticJsonDocument<200> doc;
+      JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
       if (deserializeJson(doc, payload, len)) break;
       const char* peerId = doc["id"] | "";
       if (!peerId[0]) break;
@@ -545,7 +545,7 @@ void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload,
 
 // ── MQTT message handler — E-STOP parsed first ───────────────────────────────
 void onMqttMessage(char* topic, byte* payload, unsigned int len) {
-  StaticJsonDocument<256> doc;
+  JsonDocument doc;  // ArduinoJson 7: sized on demand (StaticJsonDocument is deprecated)
   if (deserializeJson(doc, payload, len)) return;  // ignore non-JSON
   String t = String(topic);
 
diff --git a/firmware/watchtower/src/main.cpp b/firmware/watchtower/src/main.cpp
index 161c9c8..83e571b 100644
--- a/firmware/watchtower/src/main.cpp
+++ b/firmware/watchtower/src/main.cpp
@@ -391,16 +391,23 @@ void onMeshMessage(uint16_t src, uint8_t type, const uint8_t* payload,
 }
 
 // ── ADC helpers ──────────────────────────────────────────────────────────────
+// Divider math: Vin = Vadc * (R1 + R2) / R2. Read eFuse-calibrated millivolts
+// (analogReadMilliVolts), not raw counts / 4095 * 3.3, which ignores the ADC's
+// non-linearity and per-chip reference. Both dividers stay well under 2.45 V at the pin.
+static const float BATTERY_DIVIDER_GAIN = (100.0f + 10.0f) / 10.0f;   // 100k/10k = 11.0 (was 12.1, wrong)
+static const float SOLAR_DIVIDER_GAIN   = (47.0f + 10.0f) / 10.0f;    // 47k/10k = 5.7
+// NOTE (2026-11-20, unverified hardware): this env targets an ESP32-S3, where GPIO34/35 are NOT
+// ADC pins (S3 ADC1 = GPIO1-10). BATTERY_ADC/SOLAR_ADC (and the LoRa pins 18/19/23) were copied
+// from an ESP32-WROOM map; confirm the WatchTower board before trusting these readings.
+
 float readBatteryVolts() {
-  // 11.1V 3S pack → voltage divider R1=100k R2=10k → scale factor ~12.1
-  int raw = analogRead(BATTERY_ADC);
-  return (raw / 4095.0f) * 3.3f * 12.1f;
+  // 11.1 V 3S pack (12.6 V full) -> 100k/10k divider -> 1.15 V max at the pin
+  return (analogReadMilliVolts(BATTERY_ADC) / 1000.0f) * BATTERY_DIVIDER_GAIN;
 }
 
 float readSolarVolts() {
-  // 6V solar panel → voltage divider R1=47k R2=10k → scale factor ~5.7
-  int raw = analogRead(SOLAR_ADC);
-  return (raw / 4095.0f) * 3.3f * 5.7f;
+  // 6 V solar panel (~7.5 V open circuit) -> 47k/10k divider -> 1.3 V max at the pin
+  return (analogReadMilliVolts(SOLAR_ADC) / 1000.0f) * SOLAR_DIVIDER_GAIN;
 }
 
 // ── TFLite inference stub ────────────────────────────────────────────────────
