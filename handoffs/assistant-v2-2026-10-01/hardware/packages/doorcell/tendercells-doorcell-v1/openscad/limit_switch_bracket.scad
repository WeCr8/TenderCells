include <00_parameters.scad>

difference() {
  union() {
    rounded_box([34, 22, 6], r=2);
    translate([0,0,6]) cube([6,22,22]);
  }

  // Switch screw holes
  for (x=[10, 24]) {
    translate([x,11,-eps]) cylinder(h=10, d=2.4, $fn=20);
  }

  // Frame mount holes
  translate([3,6,14]) rotate([0,90,0]) m3_clearance_hole(h=10);
  translate([3,16,14]) rotate([0,90,0]) m3_clearance_hole(h=10);
}

