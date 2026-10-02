// TenderCells DoorCell V1 shared parameters
// Units: millimeters

overall_w = 438;
overall_h = 368;
frame_depth = 56;

clear_w = 242;
clear_h = 312;

rail_thick = 32;
jamb_w = 48;
motor_jamb_w = 78;

// Printability targets
target_bed_xy = 220;
comfortable_part_max = 180;

// Modular frame split dimensions
top_seg_len = overall_w / 3;
bottom_seg_len = overall_w / 3;
left_jamb_seg_h = overall_h / 2;
right_lower_h = 118;
right_motor_h = 156;
right_upper_h = overall_h - right_lower_h - right_motor_h;

// Low-cost electronics envelope used by DoorCell V1.4.
// These dimensions are based on common generic modules, not a custom PCB.
esp32_board = [58, 31, 8];
drv8871_board = [31, 26, 7];
current_sensor_board = [26, 22, 7];
lm2596_board = [44, 22, 14];
inline_fuse_body = [45, 15, 14];
cn3065_board = [44, 24, 8];
electronics_clearance = 1.5;
controller_wall = 3;
controller_box_w = 170;
controller_box_h = 115;
controller_box_d = 46;
controller_lid_insert_offset = 11;
controller_m12_gland_d = 12.8;
controller_m10_gland_d = 10.6;
controller_m8_gland_d = 8.4;
controller_button_d = 16.2;

// Brass heat-set/push-in insert features.
insert_post_d = 8.0;
insert_post_h = 8.0;
insert_pilot_d = 4.6;
insert_pilot_depth = 6.5;
hold_down_screw_clearance = 3.4;

// Motor envelope for common 25GA/JGA25-370 gearmotors with optional encoder.
motor_body_d = 25.0;
motor_body_clearance_d = 27.2;
motor_body_len = 65;
motor_encoder_clearance = 16;
motor_mount_plate = [72, 92, 12];
motor_mount_cradle = [54, 74, 28];

// Optional solar add-on.
solar_panel_w = 145;
solar_panel_h = 145;
solar_panel_t = 4.0;
solar_panel_frame_border = 10;
solar_panel_frame_w = solar_panel_w + 2*solar_panel_frame_border;
solar_panel_frame_h = solar_panel_h + 2*solar_panel_frame_border;
solar_panel_back_depth = 14;
solar_panel_lip_overlap = 3;
solar_ball_d = 22;
solar_ball_socket_clearance = 0.45;
solar_mount_m5 = 5.4;

// Tongue-and-groove frame joints
// Fit target: common FDM printers with PETG/ASA.
// Clearance is per side, so sockets add 2x this value.
tongue_len = 18;
tongue_w = 22;
tongue_z = 10;
tongue_clearance_side = 0.25;
tongue_socket_depth_extra = 0.60;

door_w = 270;
door_h = 326;
door_t = 8;

track_gap = 11;
track_depth = 12;

// Rack-and-pinion drive
// Metric module gear math:
// circular_pitch = PI * module
// pitch_diameter = module * tooth_count
// outside_diameter = module * (tooth_count + 2)
// root_diameter = module * (tooth_count - 2.5)
gear_module = 2.0;
pressure_angle = 20;
gear_backlash = 0.20; // mm removed from rack tooth thickness at pitch line

pinion_teeth = 16;
pinion_pitch_d = gear_module * pinion_teeth;
pinion_pitch_radius = pinion_pitch_d / 2;
pinion_outer_d = gear_module * (pinion_teeth + 2);
pinion_outer_radius = pinion_outer_d / 2;
pinion_root_d = gear_module * (pinion_teeth - 2.5);
pinion_root_radius = pinion_root_d / 2;
pinion_thick = 12;
shaft_d = 6.2;

rack_tooth_count = 15;
rack_circular_pitch = 3.141592653589793 * gear_module;
rack_len = rack_circular_pitch * rack_tooth_count;
rack_w = 18;
rack_t = 6;
rack_addendum = gear_module;
rack_dedendum = 1.25 * gear_module;
rack_tooth_h = rack_addendum + rack_dedendum;
rack_pitch_line_z = rack_dedendum;
rack_tooth_pitch_thickness = rack_circular_pitch / 2 - gear_backlash;
rack_tooth_top_w = rack_tooth_pitch_thickness - 2 * rack_addendum * tan(pressure_angle);
rack_tooth_root_w = rack_tooth_pitch_thickness + 2 * rack_dedendum * tan(pressure_angle);

screw_m3 = 3.4;
screw_m4 = 4.5;
insert_m3 = 4.6;

eps = 0.01;

module rounded_box(size=[10,10,10], r=2) {
  hull() {
    translate([r,r,0]) cylinder(h=size[2], r=r, $fn=24);
    translate([size[0]-r,r,0]) cylinder(h=size[2], r=r, $fn=24);
    translate([r,size[1]-r,0]) cylinder(h=size[2], r=r, $fn=24);
    translate([size[0]-r,size[1]-r,0]) cylinder(h=size[2], r=r, $fn=24);
  }
}

module m3_clearance_hole(h=20) {
  cylinder(h=h, d=screw_m3, $fn=24);
}

module m4_clearance_hole(h=20) {
  cylinder(h=h, d=screw_m4, $fn=24);
}

module heat_insert_hole(h=6) {
  cylinder(h=h, d=insert_m3, $fn=24);
}

module heat_insert_post(h=insert_post_h, d=insert_post_d) {
  difference() {
    cylinder(h=h, d=d, $fn=32);
    translate([0,0,h-insert_pilot_depth+eps])
      cylinder(h=insert_pilot_depth+eps, d=insert_pilot_d, $fn=24);
  }
}

module m3_hold_down_slot(length=10, h=4) {
  hull() {
    translate([-length/2,0,0]) cylinder(h=h, d=hold_down_screw_clearance, $fn=20);
    translate([ length/2,0,0]) cylinder(h=h, d=hold_down_screw_clearance, $fn=20);
  }
}

module rail_channel(length=100) {
  cube([length, track_gap, track_depth]);
}

module frame_tongue_x() {
  rounded_box([tongue_len, tongue_w, tongue_z], r=1.5);
}

module frame_socket_x() {
  cube([
    tongue_len + tongue_socket_depth_extra,
    tongue_w + 2*tongue_clearance_side,
    tongue_z + 2*tongue_clearance_side
  ]);
}

module frame_tongue_y() {
  rounded_box([tongue_w, tongue_len, tongue_z], r=1.5);
}

module frame_socket_y() {
  cube([
    tongue_w + 2*tongue_clearance_side,
    tongue_len + tongue_socket_depth_extra,
    tongue_z + 2*tongue_clearance_side
  ]);
}

module rack_teeth(len=rack_len) {
  teeth = floor(len / rack_circular_pitch);
  for (i=[0:teeth-1]) {
    center = i*rack_circular_pitch + rack_circular_pitch/2;
    translate([0, 0, rack_t-0.20])
      linear_extrude(height=rack_w)
        polygon(points=[
          [center - rack_tooth_root_w/2, 0],
          [center + rack_tooth_root_w/2, 0],
          [center + rack_tooth_top_w/2, rack_tooth_h],
          [center - rack_tooth_top_w/2, rack_tooth_h]
        ]);
  }
}

function polar_point(r, a) = [r * cos(a), r * sin(a)];
