include <00_parameters.scad>

box_w = controller_box_w;
box_h = controller_box_h;
box_d = controller_box_d;
wall = controller_wall;
board_z = wall - 0.4;

module clip_rail(len=10, h=5) {
  rounded_box([len, 3, h], r=1);
}

module board_footprint(size=[30,20,6], label="") {
  // Raised trays are placeholders for off-the-shelf modules and airflow.
  color([0.12,0.32,0.18,1])
    rounded_box([size[0] + 2*electronics_clearance, size[1] + 2*electronics_clearance, 1.4], r=1.5);

  translate([electronics_clearance, electronics_clearance, 1.4])
    color([0.08,0.08,0.08,1])
      rounded_box([size[0], size[1], 1.2], r=1);

  // Snap/zip-tie rails instead of assuming every cheap module has the same holes.
  translate([2, -2.8, 1.4]) clip_rail(len=size[0], h=5);
  translate([2, size[1] + electronics_clearance*2 - 0.2, 1.4]) clip_rail(len=size[0], h=5);
}

module module_insert_posts(origin=[0,0,0], board=[30,20,6], layout="four") {
  // Posts accept M3 brass heat-set/push-in threaded bushings for printed clamp bars.
  ox = origin[0];
  oy = origin[1];
  oz = origin[2];
  // Keep posts beside trays, not merged into tray edges; printed straps span over boards.
  margin = 5.5;

  if (layout == "four") {
    for (px=[ox-margin, ox+board[0]+2*electronics_clearance+margin],
         py=[oy+3, oy+board[1]+2*electronics_clearance-3]) {
      translate([px, py, oz]) heat_insert_post();
    }
  } else if (layout == "vertical") {
    px = ox + board[0]/2 + electronics_clearance;
    for (py=[oy-margin, oy+board[1]+2*electronics_clearance+margin]) {
      translate([px, py, oz]) heat_insert_post();
    }
  } else {
    for (px=[ox-margin, ox+board[0]+2*electronics_clearance+margin]) {
      translate([px, oy+board[1]/2+electronics_clearance, oz]) heat_insert_post();
    }
  }
}

difference() {
  rounded_box([box_w, box_h, box_d], r=5);

  // Hollow inside
  translate([wall, wall, wall])
    rounded_box([box_w-2*wall, box_h-2*wall, box_d-wall-2], r=4);

  // Lid screw holes
  for (x=[controller_lid_insert_offset, box_w-controller_lid_insert_offset],
       y=[controller_lid_insert_offset, box_h-controller_lid_insert_offset]) {
    translate([x,y,-eps]) heat_insert_hole(h=8);
  }

  // Cable gland holes: power/motor harness and switch/sensor harness.
  translate([box_w/2-28, -eps, 20])
    rotate([90,0,0]) cylinder(h=8, d=controller_m12_gland_d, $fn=40);
  translate([box_w/2, -eps, 20])
    rotate([90,0,0]) cylinder(h=8, d=controller_m12_gland_d, $fn=40);
  translate([box_w/2+28, -eps, 20])
    rotate([90,0,0]) cylinder(h=8, d=controller_m10_gland_d, $fn=40);

  // Optional solar input and 1S battery/service leads for CN3065 solar charger.
  translate([box_w+eps, box_h/2-18, 18])
    rotate([0,90,0]) cylinder(h=8, d=controller_m8_gland_d, $fn=32);
  translate([box_w+eps, box_h/2+18, 18])
    rotate([0,90,0]) cylinder(h=8, d=controller_m8_gland_d, $fn=32);

  // Optional local waterproof button on right wall.
  translate([box_w+eps, box_h/2, 32])
    rotate([0,90,0]) cylinder(h=8, d=controller_button_d, $fn=48);

  // Drain/vent weep slots on the lower back edge; cover externally for weather use.
  for (x=[34, 54, 74, 94, 114]) {
    translate([x, box_h-3, 4])
      cube([10, 8, 3]);
  }
}

// Electronics trays sized for the sub-$100 off-the-shelf stack.
translate([10, 14, board_z])
  board_footprint(size=esp32_board, label="ESP32");
module_insert_posts(origin=[10,14,board_z], board=esp32_board, layout="four");

translate([94, 14, board_z])
  board_footprint(size=lm2596_board, label="LM2596");
module_insert_posts(origin=[94,14,board_z], board=lm2596_board, layout="two");

translate([94, 48, board_z])
  board_footprint(size=drv8871_board, label="DRV8871");
module_insert_posts(origin=[94,48,board_z], board=drv8871_board, layout="two");

translate([133, 49, board_z])
  board_footprint(size=current_sensor_board, label="INA219");
module_insert_posts(origin=[133,49,board_z], board=current_sensor_board, layout="vertical");

// Optional CN3065 Solar Charger v1.0 tray, sized for 20 x 40 mm class boards.
translate([72, 82, board_z])
  board_footprint(size=cn3065_board, label="CN3065");
module_insert_posts(origin=[72,82,board_z], board=cn3065_board, layout="two");

// Inline fuse/service channel.
translate([13, 80, board_z])
  difference() {
    rounded_box([inline_fuse_body[0] + 8, inline_fuse_body[1] + 8, 8], r=2);
    translate([4,4,1.4])
      rounded_box([inline_fuse_body[0], inline_fuse_body[1], 8], r=2);
  }

// Harness tie-down bridges.
for (x=[64, 126, 154]) {
  translate([x, 96, board_z])
    difference() {
      rounded_box([9, 12, 5], r=1.5);
      translate([2, -eps, 1.5]) cube([5, 14, 2.4]);
    }
}
