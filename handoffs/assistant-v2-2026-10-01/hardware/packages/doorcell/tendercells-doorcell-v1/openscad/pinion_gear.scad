include <00_parameters.scad>

// Module-correct printable prototype pinion.
// Module: 2.0
// Teeth: 16
// Pressure angle: 20 degrees
// Pitch diameter: 32 mm
// Outside diameter: 36 mm
// Root diameter: 27 mm
//
// This is an FDM-friendly generated approximation using module-correct pitch,
// OD, root diameter, and tooth count. For a production kit, prefer a molded,
// machined, or fully involute-generated M2 pinion.

module tooth(angle) {
  pitch_half_angle = 90 / pinion_teeth - (gear_backlash / (2 * pinion_pitch_radius)) * 180 / 3.141592653589793;
  outer_half_angle = pitch_half_angle - (rack_addendum / pinion_pitch_radius) * tan(pressure_angle) * 180 / 3.141592653589793;
  root_half_angle = pitch_half_angle + (rack_dedendum / pinion_pitch_radius) * tan(pressure_angle) * 180 / 3.141592653589793;

  rotate([0,0,angle])
    linear_extrude(height=pinion_thick)
      polygon(points=[
        polar_point(pinion_root_radius, -root_half_angle),
        polar_point(pinion_outer_radius, -outer_half_angle),
        polar_point(pinion_outer_radius,  outer_half_angle),
        polar_point(pinion_root_radius,  root_half_angle)
      ]);
}

difference() {
  union() {
    cylinder(h=pinion_thick, r=pinion_root_radius, $fn=96);
    for (i=[0:pinion_teeth-1]) tooth(360/pinion_teeth*i);
    translate([0,0,pinion_thick])
      cylinder(h=5, r=10, $fn=48);
  }

  translate([0,0,-eps]) cylinder(h=pinion_thick+8, d=shaft_d, $fn=32);

  // M3 set screw hole
  translate([0, -10, pinion_thick+2])
    rotate([90,0,0]) cylinder(h=20, d=3.2, $fn=24);
}
