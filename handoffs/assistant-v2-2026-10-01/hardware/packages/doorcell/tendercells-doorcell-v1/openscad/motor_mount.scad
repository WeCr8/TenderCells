include <00_parameters.scad>

difference() {
  union() {
    rounded_box(motor_mount_plate, r=4);
    translate([9, 9, motor_mount_plate[2]])
      rounded_box(motor_mount_cradle, r=4);

    // Rear encoder/wire strain relief pad.
    translate([54, 25, motor_mount_plate[2]])
      rounded_box([14, 42, 16], r=3);
  }

  // 25GA/JGA25-370 body pocket. Common variants are 25 mm diameter;
  // the 27.2 mm cut leaves 1.1 mm radial clearance for print tolerance.
  translate([36, 46, motor_mount_plate[2] + 15])
    rotate([90,0,0])
      cylinder(h=motor_body_len + motor_encoder_clearance, d=motor_body_clearance_d, $fn=64);

  // Shaft and pinion hub opening.
  translate([36, -eps, motor_mount_plate[2] + 15])
    rotate([90,0,0]) cylinder(h=18, d=13, $fn=40);

  // Encoder and motor lead relief.
  translate([56, 42, motor_mount_plate[2] + 14])
    cube([20, 18, 14]);

  // Mount screws for common 25GA motor face
  for (x=[27, 45]) {
    translate([x, 8, motor_mount_plate[2] + 15])
      rotate([90,0,0]) m3_clearance_hole(h=16);
  }

  // Frame mounting holes
  for (x=[13, 59], y=[13, 79]) {
    translate([x, y, -eps]) m3_clearance_hole(h=motor_mount_plate[2] + 4);
  }

  // Vertical adjustment slots allow pinion/rack mesh tuning.
  for (x=[13, 59], y=[35, 57]) {
    translate([x, y, -eps])
      hull() {
        translate([0,-4,0]) m3_clearance_hole(h=motor_mount_plate[2] + 4);
        translate([0, 4,0]) m3_clearance_hole(h=motor_mount_plate[2] + 4);
      }
  }
}
