# Electronics and power

Controller: Seeed Studio XIAO ESP32C3. Load-cell ADC: HX711. Actuator: genuine or dimensionally verified MG996R-class positional servo.

Do not power the servo through the XIAO regulator. Use a regulated 5-6 V rail sized for servo transient current and join grounds with the XIAO. TowerPro lists MG996R stall current around 1.4 A and operating voltage 4.8-6.6 V, so a 2 A minimum rail is a reasonable classroom baseline and 3 A gives margin.

For battery operation, use a protected commercial USB power bank or a protected battery pack plus appropriate regulator. Keep raw lithium-cell assembly out of younger-student activities.
