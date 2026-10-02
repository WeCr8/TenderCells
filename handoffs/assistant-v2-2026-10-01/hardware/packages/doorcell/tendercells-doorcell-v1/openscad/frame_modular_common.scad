include <00_parameters.scad>

module horizontal_frame_segment(seg_len=top_seg_len, rail_kind="top", joint_left="socket", joint_right="tongue") {
  difference() {
    union() {
      rounded_box([seg_len, rail_thick, frame_depth], r=6);

      if (joint_right == "tongue") {
        translate([seg_len - eps, rail_thick/2 - tongue_w/2, frame_depth/2 - tongue_z/2])
          frame_tongue_x();
      }
    }

    // Tongue receiver from previous segment.
    if (joint_left == "socket") {
      translate([
        -eps,
        rail_thick/2 - (tongue_w + 2*tongue_clearance_side)/2,
        frame_depth/2 - (tongue_z + 2*tongue_clearance_side)/2
      ])
        frame_socket_x();
    }

    // Sliding door guide channel.
    if (rail_kind == "top") {
      translate([8, rail_thick-track_gap-5, 8])
        rail_channel(length=seg_len-16);
    } else {
      translate([8, 5, frame_depth-track_depth-8])
        rail_channel(length=seg_len-16);

      // Drain slots for bottom rail.
      for (x=[seg_len*0.25, seg_len*0.5, seg_len*0.75]) {
        translate([x-10, rail_thick/2-2, frame_depth-4])
          cube([20, 4, 10]);
      }
    }

    // Coop mounting holes.
    for (x=[18, seg_len-18]) {
      translate([x, rail_thick/2, -eps])
        m4_clearance_hole(h=frame_depth+2);
    }

    // Cross-bolt holes near frame split joints.
    if (joint_left == "socket") {
      translate([tongue_len/2, rail_thick/2, frame_depth/2])
        rotate([90,0,0]) m3_clearance_hole(h=rail_thick+2);
    }
    if (joint_right == "tongue") {
      translate([seg_len + tongue_len/2 - 2, rail_thick/2, frame_depth/2])
        rotate([90,0,0]) m3_clearance_hole(h=rail_thick+2);
    }
  }
}

module left_jamb_segment(seg_h=left_jamb_seg_h, joint_bottom="socket", joint_top="tongue", corner_bottom=false, corner_top=false) {
  difference() {
    union() {
      rounded_box([jamb_w, seg_h, frame_depth], r=6);

      if (joint_top == "tongue") {
        translate([jamb_w/2 - tongue_w/2, seg_h - eps, frame_depth/2 - tongue_z/2])
          frame_tongue_y();
      }
    }

    if (joint_bottom == "socket") {
      translate([
        jamb_w/2 - (tongue_w + 2*tongue_clearance_side)/2,
        -eps,
        frame_depth/2 - (tongue_z + 2*tongue_clearance_side)/2
      ])
        frame_socket_y();
    }

    // Door pocket relief.
    translate([jamb_w-18, 0, 8])
      cube([16, seg_h, frame_depth-16]);

    // Coop mounting holes.
    for (y=[seg_h*0.28, seg_h*0.72]) {
      translate([jamb_w/2, y, -eps]) m4_clearance_hole(h=frame_depth+2);
    }

    // Rail-to-jamb corner holes.
    if (corner_bottom) {
      translate([jamb_w-10, 16, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=20);
    }
    if (corner_top) {
      translate([jamb_w-10, seg_h-16, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=20);
    }

    // Cross-bolt through tongue-and-groove.
    if (joint_bottom == "socket") {
      translate([jamb_w/2, tongue_len/2, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=jamb_w+2);
    }
    if (joint_top == "tongue") {
      translate([jamb_w/2, seg_h + tongue_len/2 - 2, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=jamb_w+2);
    }
  }
}

module right_jamb_segment(seg_h=120, has_motor_bay=false, joint_bottom="socket", joint_top="tongue", corner_bottom=false, corner_top=false) {
  difference() {
    union() {
      rounded_box([motor_jamb_w, seg_h, frame_depth], r=6);

      if (has_motor_bay) {
        translate([motor_jamb_w-8, 20, 0])
          rounded_box([70, seg_h-32, frame_depth], r=5);
      }

      if (joint_top == "tongue") {
        translate([motor_jamb_w/2 - tongue_w/2, seg_h - eps, frame_depth/2 - tongue_z/2])
          frame_tongue_y();
      }
    }

    if (joint_bottom == "socket") {
      translate([
        motor_jamb_w/2 - (tongue_w + 2*tongue_clearance_side)/2,
        -eps,
        frame_depth/2 - (tongue_z + 2*tongue_clearance_side)/2
      ])
        frame_socket_y();
    }

    // Door pocket relief.
    translate([0, 0, 8])
      cube([20, seg_h, frame_depth-16]);

    if (has_motor_bay) {
      // Motor cassette pocket sized for the revised 25GA mount.
      translate([motor_jamb_w+5, 33, 8])
        cube([62, 92, 40]);

      // Pinion/rack engagement window.
      translate([4, 68, 16])
        cube([46, 36, 24]);

      // Motor/control harness pass-through for M12-style cable gland routing.
      translate([motor_jamb_w+26, seg_h-42, 16])
        cube([24, 34, 26]);

      // Limit switch lead pass-throughs.
      translate([motor_jamb_w-2, 18, 18])
        cube([16, 18, 16]);
      translate([motor_jamb_w-2, seg_h-36, 18])
        cube([16, 18, 16]);
    }

    // Coop mounting holes.
    for (y=[seg_h*0.28, seg_h*0.72]) {
      translate([motor_jamb_w/2, y, -eps]) m4_clearance_hole(h=frame_depth+2);
    }

    // Rail-to-jamb corner holes.
    if (corner_bottom) {
      translate([10, 16, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=20);
    }
    if (corner_top) {
      translate([10, seg_h-16, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=20);
    }

    // Cross-bolt through tongue-and-groove.
    if (joint_bottom == "socket") {
      translate([motor_jamb_w/2, tongue_len/2, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=motor_jamb_w+2);
    }
    if (joint_top == "tongue") {
      translate([motor_jamb_w/2, seg_h + tongue_len/2 - 2, frame_depth/2])
        rotate([0,90,0]) m3_clearance_hole(h=motor_jamb_w+2);
    }
  }
}
