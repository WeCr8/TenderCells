include <00_parameters.scad>

outer_w = solar_panel_frame_w;
outer_h = solar_panel_frame_h;
tray_d = solar_panel_back_depth;
panel_clearance = 0.8;

difference() {
  union() {
    rounded_box([outer_w, outer_h, tray_d], r=5);

    // Rear reinforced pad for the ball socket clamp.
    translate([outer_w/2-24, outer_h/2-24, 0])
      rounded_box([48, 48, 8], r=4);

    // Heat-set insert bosses for the front bezel screws.
    for (x=[12, outer_w-12], y=[12, outer_h-12]) {
      translate([x,y,tray_d-insert_post_h])
        heat_insert_post();
    }
  }

  // Shallow 145 mm panel pocket. The front bezel retains the panel.
  translate([
    solar_panel_frame_border - panel_clearance/2,
    solar_panel_frame_border - panel_clearance/2,
    tray_d - solar_panel_t - 1.0
  ])
    cube([
      solar_panel_w + panel_clearance,
      solar_panel_h + panel_clearance,
      solar_panel_t + 2
    ]);

  // Rear center M5 through-hole for the panel-side ball socket.
  translate([outer_w/2, outer_h/2, -eps])
    cylinder(h=tray_d+10, d=solar_mount_m5, $fn=32);

  // Solar panel lead exit channel.
  translate([outer_w/2-5, -eps, tray_d-7])
    cube([10, solar_panel_frame_border+6, 5]);
}
