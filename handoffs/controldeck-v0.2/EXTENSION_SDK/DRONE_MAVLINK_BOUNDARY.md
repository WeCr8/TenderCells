# Drone / MAVLink Boundary

TenderCells Control Deck should produce normalized pilot intent.

A MAVLink adapter may translate that to a supported manual-control message.

TenderCells must not:
- mix motor outputs
- replace flight stabilization
- bypass arming checks
- bypass flight-controller geofence
- bypass loss-of-link failsafe
- disable return-to-home safeguards

Initial drone integration must use SITL before physical flight.
