# Complete load-cell package

Reference mechanical cell: TAL220B-style 5 kg parallel beam, 55 x 12.7 x 12.7 mm, two M5 holes on 40 mm centers. One end is fixed to the base; the opposite end supports the floating platform. Keep all other geometry clear of the floating platform so loads cannot bypass the cell.

Electronics: HX711 24-bit load-cell ADC and XIAO ESP32C3. For the SparkFun TAL220B color convention: Red Exc+, Black Exc-, Green Sig+, White Sig-. Verify the exact purchased cell before final wiring because clone colors can differ.

Calibration: tare empty, apply known mass, calculate factor, verify zero/mid/full, and repeat after the feeder is moved.
