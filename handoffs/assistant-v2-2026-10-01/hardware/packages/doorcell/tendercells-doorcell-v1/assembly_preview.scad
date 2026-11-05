// TenderCells DoorCell V1.4 electronics + solar-ready assembly preview
// This file imports the generated STL parts into an approximate assembled view.

stl = "stl/";

overall_w = 438;
overall_h = 368;
frame_depth = 56;
rail_thick = 32;
jamb_w = 48;
motor_jamb_w = 78;
top_seg_len = overall_w / 3;
bottom_seg_len = overall_w / 3;
left_jamb_seg_h = overall_h / 2;
right_lower_h = 118;
right_motor_h = 156;
right_upper_h = overall_h - right_lower_h - right_motor_h;

door_part_w = 270/2 + 14;
door_part_h = 326/2 + 8;

module part(name, c=[0.82,0.82,0.78,1]) {
  color(c) import(str(stl, name, ".stl"), convexity=10);
}

module screw_head(x, y, z=59) {
  color([0.08,0.08,0.08,1])
    translate([x,y,z]) cylinder(h=3, d=8, $fn=32);
}

// Frame ring
part("frame_top_left");
translate([top_seg_len,0,0]) part("frame_top_center");
translate([top_seg_len*2,0,0]) part("frame_top_right");

translate([0,overall_h-rail_thick,0]) part("frame_bottom_left");
translate([bottom_seg_len,overall_h-rail_thick,0]) part("frame_bottom_center");
translate([bottom_seg_len*2,overall_h-rail_thick,0]) part("frame_bottom_right");

translate([0,rail_thick,0]) part("frame_left_lower");
translate([0,rail_thick+left_jamb_seg_h,0]) part("frame_left_upper");

translate([overall_w-motor_jamb_w,rail_thick,0]) part("frame_right_lower");
translate([overall_w-motor_jamb_w,rail_thick+right_lower_h,0]) part("frame_right_motor_mid");
translate([overall_w-motor_jamb_w,rail_thick+right_lower_h+right_motor_h,0]) part("frame_right_upper");

// Sliding door shown partially closed so the opening and rack are visible.
door_x = 151;
door_y = 21;
door_z = 18;

translate([door_x, door_y+door_part_h, door_z]) part("sliding_door_left_upper", [0.22,0.62,0.14,1]);
translate([door_x, door_y, door_z]) part("sliding_door_left_lower", [0.22,0.62,0.14,1]);
translate([door_x+door_part_w-14, door_y+door_part_h, door_z]) part("sliding_door_right_upper", [0.26,0.72,0.16,1]);
translate([door_x+door_part_w-14, door_y, door_z]) part("sliding_door_right_lower", [0.26,0.72,0.16,1]);

// Rack strips on lower rear/front edge of moving door.
translate([door_x+8, door_y+19, door_z+12]) part("rack_strip", [0.92,0.92,0.86,1]);
translate([door_x+99, door_y+19, door_z+12]) part("rack_strip", [0.92,0.92,0.86,1]);
translate([door_x+190, door_y+19, door_z+12]) part("rack_strip", [0.92,0.92,0.86,1]);

// Motor cassette and pinion in right jamb.
translate([overall_w-motor_jamb_w+72, rail_thick+right_lower_h+32, 8])
  rotate([0,0,90]) part("motor_mount", [0.24,0.24,0.25,1]);

translate([overall_w-motor_jamb_w+32, rail_thick+right_lower_h+78, 36])
  part("pinion_gear", [0.12,0.12,0.12,1]);

// Controller box offset like an external control pod.
translate([-195, rail_thick+right_lower_h+20, 8])
  part("controller_box", [0.62,0.66,0.60,1]);

// Optional solar panel housing and adjustable ball mount preview.
translate([-205, -150, 12])
  part("solar_panel_back_tray", [0.18,0.18,0.18,1]);
translate([-205, -150, 27])
  part("solar_panel_front_bezel", [0.05,0.05,0.05,1]);
translate([-120, -78, -32])
  part("solar_ball_mount_base", [0.62,0.66,0.60,1]);

// Cable preview between controller and motor bay.
color([0.02,0.02,0.02,1])
  hull() {
    translate([-25, rail_thick+right_lower_h+70, 32]) sphere(d=5, $fn=16);
    translate([overall_w-motor_jamb_w+42, rail_thick+right_lower_h+82, 32]) sphere(d=5, $fn=16);
  }

// A few visible screw heads for assembly feel.
for (x=[22, top_seg_len+22, top_seg_len*2+22, overall_w-24]) {
  screw_head(x, 16);
  screw_head(x, overall_h-16);
}
for (y=[55, overall_h/2, overall_h-55]) {
  screw_head(24, y);
  screw_head(overall_w-39, y);
}

// Labels as simple embossed blocks for visual orientation.
color([0.05,0.36,0.20,1])
  translate([overall_w/2-48, -26, 4])
    linear_extrude(height=2)
      text("DoorCell V1.4", size=18, font="Liberation Sans:style=Bold");
