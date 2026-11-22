## origin/docs/chicken-tender-build-2026-11-20
```
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:59:// GPIO12 is a boot strapping pin (MTDI, flash voltage select): driving it HIGH at reset
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:61:#define PIN_STEPPER_ENABLE  33     // cleaning scraper stepper, active-LOW enable
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:66:// Normally-closed E-STOP button: GPIO32 -> NC contact -> GND, internal pull-up.
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:68:// wired latches E-STOP until GPIO32 is tied to GND through the NC contact (bench only: build
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:69:// with -DCT_ESTOP_INPUT=0). Watched by a RISING-edge interrupt AND read every loop pass.
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:70:#define PIN_ESTOP_IN        32
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:71:#ifndef CT_ESTOP_INPUT
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:72:#define CT_ESTOP_INPUT      1
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:112:volatile bool hwEStopEdge = false;   // set by the GPIO32 ISR; pollEStopInput() finishes the stop
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:114:#if CT_ESTOP_INPUT
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:210:  pinMode(PIN_STEPPER_ENABLE, OUTPUT);
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:216:#if CT_ESTOP_INPUT
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:217:  pinMode(PIN_ESTOP_IN, INPUT_PULLUP);
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:218:  attachInterrupt(digitalPinToInterrupt(PIN_ESTOP_IN), onHwEStop, RISING);
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:565:#if CT_ESTOP_INPUT
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:568:  const bool open = digitalRead(PIN_ESTOP_IN) == HIGH;
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:612:  digitalWrite(PIN_STEPPER_ENABLE, LOW);   // enable (active-LOW)
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:625:  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable — never leave stepper energized
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:632:  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable stepper (active-LOW enable)
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:646:#if CT_ESTOP_INPUT
origin/docs/chicken-tender-build-2026-11-20:firmware/chicken-tender/src/main.cpp:647:  if (digitalRead(PIN_ESTOP_IN) == HIGH) {   // button still open: refuse to clear
```
## origin/fix/chicken-tender-mq137-ppm-2026-11-20
```
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:59:// GPIO12 is a boot strapping pin (MTDI, flash voltage select): driving it HIGH at reset
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:61:#define PIN_STEPPER_ENABLE  33     // cleaning scraper stepper, active-LOW enable
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:66:// Normally-closed E-STOP button: GPIO32 -> NC contact -> GND, internal pull-up.
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:68:// wired latches E-STOP until GPIO32 is tied to GND through the NC contact (bench only: build
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:69:// with -DCT_ESTOP_INPUT=0). Watched by a RISING-edge interrupt AND read every loop pass.
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:70:#define PIN_ESTOP_IN        32
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:71:#ifndef CT_ESTOP_INPUT
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:72:#define CT_ESTOP_INPUT      1
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:112:volatile bool hwEStopEdge = false;   // set by the GPIO32 ISR; pollEStopInput() finishes the stop
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:114:#if CT_ESTOP_INPUT
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:210:  pinMode(PIN_STEPPER_ENABLE, OUTPUT);
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:216:#if CT_ESTOP_INPUT
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:217:  pinMode(PIN_ESTOP_IN, INPUT_PULLUP);
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:218:  attachInterrupt(digitalPinToInterrupt(PIN_ESTOP_IN), onHwEStop, RISING);
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:565:#if CT_ESTOP_INPUT
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:568:  const bool open = digitalRead(PIN_ESTOP_IN) == HIGH;
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:612:  digitalWrite(PIN_STEPPER_ENABLE, LOW);   // enable (active-LOW)
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:625:  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable — never leave stepper energized
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:632:  digitalWrite(PIN_STEPPER_ENABLE, HIGH);  // disable stepper (active-LOW enable)
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:646:#if CT_ESTOP_INPUT
origin/fix/chicken-tender-mq137-ppm-2026-11-20:firmware/chicken-tender/src/main.cpp:647:  if (digitalRead(PIN_ESTOP_IN) == HIGH) {   // button still open: refuse to clear
```
