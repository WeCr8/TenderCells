/*
 Tender Cells Classroom Smart Feeder v3
 DEFAULT ACTUATOR: 28BYJ-48 5V geared stepper + ULN2003
 Six pockets = 60 degrees per dispense.

 IMPORTANT: 28BYJ-48 gear ratios vary. POCKET_STEPS is a calibration value.
 Start near 683 half-steps per pocket when using ~4096 half-steps/output rev,
 then tune so six indexes return exactly to the Hall home mark.
*/
#include <Arduino.h>
#include <HX711.h>
#include <AccelStepper.h>

constexpr int IN1=2, IN2=3, IN3=4, IN4=5;
constexpr int HX_DOUT=6, HX_SCK=7;
constexpr int HALL_PIN=8;
constexpr long POCKET_STEPS=683;   // CALIBRATE ON YOUR ACTUAL MOTOR/GEARBOX
constexpr float HX_CAL=1.0f;       // CALIBRATE WITH KNOWN WEIGHT

AccelStepper stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);
HX711 scale;

void homeRotor(){
  stepper.setSpeed(180);
  long guard=0;
  while(digitalRead(HALL_PIN)==HIGH && guard<6000){
    stepper.runSpeed();
    guard++;
  }
  stepper.setCurrentPosition(0);
}

void dispenseOnePocket(){
  long target=stepper.currentPosition()+POCKET_STEPS;
  stepper.moveTo(target);
  while(stepper.distanceToGo()!=0) stepper.run();
}

void setup(){
  pinMode(HALL_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  stepper.setMaxSpeed(700);
  stepper.setAcceleration(350);
  scale.begin(HX_DOUT,HX_SCK);
  scale.set_scale(HX_CAL);
  scale.tare();
  homeRotor();
}

void loop(){
  if(Serial.available()){
    char c=Serial.read();
    if(c=='D') dispenseOnePocket();
    if(c=='H') homeRotor();
    if(c=='W' && scale.is_ready()) Serial.println(scale.get_units(10),1);
  }
}
