/*
 PROPOSED v3a - NOT COMPILED, NOT FLASHED, NOT BENCH TESTED.
 Changes from TenderCells_Feeder_v3_SIX_POCKET_STEPPER.ino (see ENGINEERING_REVIEW_INDEPENDENT.md E1, E2, E6, E7):
  - pins use the XIAO ESP32-C3 "Dn" labels from Electronics/PINOUT.csv (not raw GPIO numbers, avoids D0 and D8 boot-strap pins)
  - homing is time-limited (not an iteration count), reports failure, and never loops forever
  - every move has a time-out; coils are released after each move (no holding current, less heat)
  - serial replies for every command so a host can detect failure
 Wiring rules: HX711 powered from 3.3 V; A3144 Hall powered from 5 V with its open-collector output pulled up to 3.3 V
 (the internal pull-up below is enough only if the Hall output is open-collector; otherwise add an external 10k to 3.3 V).
 Still to do on the bench: calibrate POCKET_STEPS and HX_CAL, confirm Hall polarity, confirm 6 indexes return to the mark.
*/
#include <Arduino.h>
#include <HX711.h>
#include <AccelStepper.h>

constexpr int HX_DOUT = D1, HX_SCK = D2;          // PINOUT.csv: HX711_DT, HX711_SCK
constexpr int HALL_PIN = D3;                      // PINOUT.csv: HALL_HOME (active LOW when the magnet is at the sensor)
constexpr int IN1 = D4, IN2 = D5, IN3 = D6, IN4 = D7;   // PINOUT.csv: STEP_IN1..4 -> ULN2003 IN1..IN4
constexpr long POCKET_STEPS = 683;                // PLACEHOLDER: calibrate on the real motor (half-steps per 60 degrees)
constexpr float HX_CAL = 1.0f;                    // PLACEHOLDER: calibrate with a known weight
constexpr unsigned long HOME_TIMEOUT_MS = 30000;  // one full output revolution at 180 steps/s is about 23 s
constexpr unsigned long MOVE_TIMEOUT_MS = 5000;   // one pocket at the set speed takes well under this

AccelStepper stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);   // ULN2003 / 28BYJ-48 coil order
HX711 scale;

bool homeRotor() {
  stepper.setMaxSpeed(250);
  stepper.setSpeed(180);
  unsigned long t0 = millis();
  while (digitalRead(HALL_PIN) == HIGH) {
    stepper.runSpeed();
    if (millis() - t0 > HOME_TIMEOUT_MS) {
      stepper.disableOutputs();
      return false;                                // magnet not found: do not pretend we are homed
    }
  }
  stepper.setCurrentPosition(0);
  stepper.disableOutputs();
  stepper.setMaxSpeed(700);
  return true;
}

bool dispenseOnePocket() {
  stepper.moveTo(stepper.currentPosition() + POCKET_STEPS);
  unsigned long t0 = millis();
  while (stepper.distanceToGo() != 0) {
    stepper.run();
    if (millis() - t0 > MOVE_TIMEOUT_MS) {
      stepper.disableOutputs();
      return false;
    }
  }
  stepper.disableOutputs();                        // release coils: no holding current
  return true;
}

void setup() {
  pinMode(HALL_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  stepper.setMaxSpeed(700);
  stepper.setAcceleration(350);
  scale.begin(HX_DOUT, HX_SCK);
  scale.set_scale(HX_CAL);
  // No tare at boot: a full hopper would be tared away. Tare only on an explicit 'T' with the hopper in a known state.
  Serial.println(homeRotor() ? "HOME_OK" : "HOME_FAIL");
}

void loop() {
  if (!Serial.available()) return;
  char c = Serial.read();
  if (c == 'D') Serial.println(dispenseOnePocket() ? "DISPENSED" : "MOVE_TIMEOUT");
  else if (c == 'H') Serial.println(homeRotor() ? "HOME_OK" : "HOME_FAIL");
  else if (c == 'T') { if (scale.is_ready()) { scale.tare(); Serial.println("TARED"); } else Serial.println("SCALE_NOT_READY"); }
  else if (c == 'W') { if (scale.is_ready()) Serial.println(scale.get_units(10), 1); else Serial.println("SCALE_NOT_READY"); }
}
