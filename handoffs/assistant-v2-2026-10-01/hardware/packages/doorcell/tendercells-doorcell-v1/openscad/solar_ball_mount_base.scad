include <00_parameters.scad>

base_w = 64;
base_h = 46;
base_t = 8;
stem_h = 24;

difference() {
  union() {
    rounded_box([base_w, base_h, base_t], r=4);

    translate([base_w/2, base_h/2, base_t])
      cylinder(h=stem_h, d=16, $fn=48);

    translate([base_w/2, base_h/2, base_t+stem_h])
      sphere(d=solar_ball_d, $fn=64);
  }

  // M4 mounting screws to coop wall, post, or bracket.
  for (x=[14, base_w-14]) {
    translate([x, base_h/2, -eps])
      m4_clearance_hole(h=base_t+2);
  }
}
