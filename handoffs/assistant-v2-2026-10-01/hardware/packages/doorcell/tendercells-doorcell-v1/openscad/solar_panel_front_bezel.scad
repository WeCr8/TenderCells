include <00_parameters.scad>

outer_w = solar_panel_frame_w;
outer_h = solar_panel_frame_h;
bezel_t = 7;
window_w = solar_panel_w - 2*solar_panel_lip_overlap;
window_h = solar_panel_h - 2*solar_panel_lip_overlap;

difference() {
  rounded_box([outer_w, outer_h, bezel_t], r=5);

  // Visible panel window. The lip overlaps the 145 mm panel by 3 mm per side.
  translate([
    (outer_w-window_w)/2,
    (outer_h-window_h)/2,
    -eps
  ])
    cube([window_w, window_h, bezel_t+2*eps]);

  // M3 screw clearance holes into the rear tray heat inserts.
  for (x=[12, outer_w-12], y=[12, outer_h-12]) {
    translate([x,y,-eps]) m3_clearance_hole(h=bezel_t+2);
  }
}
