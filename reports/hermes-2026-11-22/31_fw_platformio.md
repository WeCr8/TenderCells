```diff
-- a/firmware/chicken-tender/platformio.ini
+++ b/firmware/chicken-tender/platformio.ini
@@ -21,7 +21,7 @@ board_build.flash_size = 4MB
 ; Libraries — motion/sensor control is MQTT-only; no Firebase on the device.
 lib_deps =
   knolleary/PubSubClient@^2.8
-  bblanchon/ArduinoJson@^7.0.0
+  bblanchon/ArduinoJson@^7.2.0
   adafruit/DHT sensor library@^1.4.4
   adafruit/Adafruit Unified Sensor@^1.1.14
   tzapu/WiFiManager@^2.0.17
@@ -32,10 +32,23 @@ build_flags =
   -DCORE_DEBUG_LEVEL=5
   -DESP32
   -DBOARD_CHICKEN_TENDER
+  ; 1 (default) = NC E-STOP button on GPIO32 (NC contact -> GND), interrupt + every loop.
+  ; Without the button wired the pull-up reads "open" and the controller stays in E-STOP,
+  ; which is the safe default. 0 only for a bench board with no moving hardware.
+  -DCT_ESTOP_INPUT=1
+
+; Our own sources must compile with zero warnings (libraries are not covered).
+build_src_flags =
+  -Wall
+  -Wextra
+  -Werror
 
 ; Monitor
 monitor_filters = esp32_exception_decoder
 
+; test/host holds plain-C++ host tests (make -C test/host), not PlatformIO unit tests.
+test_ignore = host
+
 ; OTA upload (optional)
 ; upload_protocol = espota
 ; upload_port = 192.168.4.1
```