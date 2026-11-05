include <00_parameters.scad>

difference() {
  union() {
    cube([rack_len, rack_w, rack_t]);
    rack_teeth(len=rack_len);
  }

  for (x=[12, rack_len/2, rack_len-12]) {
    translate([x, rack_w/2, -eps]) m3_clearance_hole(h=rack_t+rack_tooth_h+2);
  }
}
