# Actuator selection — IMPORTANT

## Default: 28BYJ-48 geared stepper + ULN2003
The six-pocket rotor requires controlled 360-degree rotation and repeatable 60-degree indexing. A geared stepper is therefore the default classroom actuator. Use the Hall sensor and magnet as a home reference and calibrate the steps-per-pocket on the actual gearbox.

## Alternate: MG996R + 25T hub
The MG996R hardware stack remains in the package because it is useful for gates, doors, and limited-angle feeder mechanisms. A normal positional MG996R is **not** the default direct-drive actuator for the six-pocket rotor because its angular travel does not provide full 360-degree indexing.

## Why both are included
This lets classrooms compare positional servos with geared steppers and understand open-loop indexing, homing, gearing, and feedback.
