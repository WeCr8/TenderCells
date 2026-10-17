include <00_parameters.scad>

difference() {
  rounded_box([76, 52, 4], r=4);

  // Finger pull
  translate([38, 26, -eps]) cylinder(h=8, d=22, $fn=48);

  // Mount holes
  for (x=[10, 66], y=[9, 43]) {
    translate([x,y,-eps]) m3_clearance_hole(h=8);
  }
}

