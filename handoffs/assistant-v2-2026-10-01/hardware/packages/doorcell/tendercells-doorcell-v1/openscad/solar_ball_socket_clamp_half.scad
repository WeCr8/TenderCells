include <00_parameters.scad>

clamp_w = 58;
clamp_h = 22;
clamp_d = 28;
cup_d = solar_ball_d + 2*solar_ball_socket_clearance;

difference() {
  union() {
    rounded_box([clamp_w, clamp_h, clamp_d], r=3);

    // Panel attachment boss for M5 bolt into solar panel back tray.
    translate([clamp_w/2-12, -7, clamp_d/2-7])
      rounded_box([24, 8, 14], r=2);
  }

  // Half-cup for the 22 mm ball. Print two clamp halves.
  translate([clamp_w/2, clamp_h, clamp_d/2])
    sphere(d=cup_d, $fn=64);

  // Clamp screw clearance holes.
  for (x=[12, clamp_w-12]) {
    translate([x, clamp_h/2, clamp_d/2])
      rotate([90,0,0]) m3_clearance_hole(h=clamp_h+18);
  }

  // M5 panel attachment clearance.
  translate([clamp_w/2, -8, clamp_d/2])
    rotate([90,0,0])
      cylinder(h=10, d=solar_mount_m5, $fn=32);
}
