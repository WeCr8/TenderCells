# Feed, water, weather and lighting operating model

## Feed — do not turn a rule-of-thumb into an actuator command
UC Davis veterinary education and extension references give an example of approximately **0.25 lb (113.4g) per adult laying hen per day**; actual intake varies with flock composition, breed, diet, age, season and management. The default workbook deliberately leaves flock count **zero / unknown**. Support flock stage/age and keeper-entered feed type. Record `feed_added_g`, `feed_spilled_g` (if measurable), `dispenser_dispensed_g` and `feed_leftover_g`. Calculated consumed quantity must be labeled estimated and should account for spills, wild birds and shared feed. General access to a balanced appropriate ration matters; a schedule alone does not guarantee adequate feed. Never automatically order feed from spreadsheets.

## Water — continuous availability
Fresh clean water remains accessible continuously. Routine checks are reminders for level, temperature, hygiene and flow. For hardware waterer `water.dispense_ml`, require calibrated flow measurement, target threshold, high/low level sensors, overfill detection, maximum runtime and watchdog. Keep separate `relay.on_off` for the existing starter-node generic actuator. A timer-based relay test cannot truthfully confirm milliliters delivered. Hazard response must stop pumps even if MQTT or cloud is lost.

## Weather integration
Preferred US operational provider: NWS API via HTTPS at `api.weather.gov`, call `/points/{lat},{lon}` then follow returned hourly/gridpoint URL, and `/alerts/active?point={lat},{lon}` as appropriate. Use a descriptive, maintained User-Agent (domain + contact) and respectful caching/backoff/ETag as docs permit. Provider metadata must include `provider`, `validFrom`, `validUntil`, `issuedAt`, `fetchedAt`, `point`, `units`, `quality`, and `stale`. NWS forecast and alerts do not replace local coop sensor conditions. On provider error show stale/unknown, no fabricated 0 F or 0% values. Open-Meteo free endpoint is intended for noncommercial use; for a sold/subscription TenderCells feature obtain commercial licensing or use appropriately licensed alternative.

## Conditional care (initial informational thresholds only)
| Rule | Starting cue | Output | Actuation |
|---|---|---|---|
| Warm day review | Forecast >=80 F OR coop sensor increased | Check shade, airflow and water; increase observation | NO |
| Heat stress check | Coop >=85 F, panting or lethargy observed | Human welfare review; avoid assuming threshold diagnoses a bird | NO |
| Extreme heat | High >=95 F or official alert | Escalation, frequent water checks | NO |
| Rain/wind | Weather alert/forecast | Shelter/drainage inspection; suspend risky outdoor robots | HOLD/ALERT only until validated |
| Low water | Installed, calibrated water sensor + fresh sample | Alert; optional supervised tested fill | NO by default |
| Feed low | Measured hopper weight below keeper threshold | Refill reminder | NO |
| Early dark | Lux drop + shade window / observations | Start checking returned birds | NO door close |
| Predator | Trusted alert and local device state | Human alert and local safety response | NEVER blind close on unknown birds |

## Seasonal lighting
Optional supplemental lighting for egg production is a separate keeper opt-in, age-appropriate plan, not an automatic default. Prefer gentle, consistent before-dawn supplemental lighting to prevent abrupt darkness at roost; ensure dark-rest period and no long-term photo-stimulation for unsuitable birds. Treat ambient daylight and actual enclosure lux separately. Do not energize heat lamps from a weather forecast alone.

## References
- https://cvet.vetmed.ucdavis.edu/sites/g/files/dgvnsk13661/files/inline-files/CVET%20Avian%20and%20Exotics%20Animal%20Care%20and%20Feeding%20Guide%20010725_0.pdf
- https://www.aces.edu/blog/topics/farming/backyard-small-poultry-flock-management-series-feeding-the-laying-hen/
- https://extension.umn.edu/agriculture/animals-and-livestock/poultry/preventing-heat-stress-in-poultry
- https://www.weather.gov/documentation/services-web-api
- https://www.weather.gov/documentation/services-web-alerts
- https://open-meteo.com/en/terms
- https://gml.noaa.gov/grad/solcalc/
