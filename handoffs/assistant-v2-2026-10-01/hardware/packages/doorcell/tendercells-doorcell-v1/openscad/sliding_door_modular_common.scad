include <00_parameters.scad>

door_part_w = door_w/2 + 14;
door_part_h = door_h/2 + 8;
door_mid_overlap = 14;
door_v_overlap = 12;

module door_tongue_y(width=72) {
  rounded_box([width, door_v_overlap, 3], r=1.5);
}

module door_socket_y(width=74) {
  cube([width, door_v_overlap + 2*tongue_clearance_side, 3.8]);
}

module sliding_door_quadrant(side="left", row="lower") {
  difference() {
    union() {
      rounded_box([door_part_w, door_part_h, door_t], r=5);

      // Vertical center lap between left and right panels.
      if (side == "left") {
        translate([door_part_w-door_mid_overlap, 0, 0])
          cube([door_mid_overlap, door_part_h, door_t/2]);
      } else {
        translate([0, 0, door_t/2])
          cube([door_mid_overlap, door_part_h, door_t/2]);
      }

      // Horizontal lap between lower and upper panels.
      if (row == "lower") {
        translate([door_part_w/2-36, door_part_h-eps, door_t])
          door_tongue_y(width=72);
      }

      // Stiffening ribs.
      translate([10, 18, door_t])
        cube([5, door_part_h-36, 5]);
      translate([door_part_w-20, 18, door_t])
        cube([5, door_part_h-36, 5]);
      translate([18, door_part_h/2, door_t])
        cube([door_part_w-36, 5, 5]);
    }

    if (row == "upper") {
      translate([door_part_w/2-37, -eps, door_t-0.2])
        door_socket_y(width=74);
    }

    // Center lap fastener holes.
    if (side == "left") {
      for (y=[42, door_part_h-42]) {
        translate([door_part_w-door_mid_overlap/2, y, -eps])
          m3_clearance_hole(h=door_t+10);
      }
    } else {
      for (y=[42, door_part_h-42]) {
        translate([door_mid_overlap/2, y, -eps])
          heat_insert_hole(h=door_t+1);
      }
    }

    // Horizontal split fastener holes.
    if (row == "lower") {
      for (x=[door_part_w*0.33, door_part_w*0.67]) {
        translate([x, door_part_h-8, -eps])
          m3_clearance_hole(h=door_t+10);
      }
    } else {
      for (x=[door_part_w*0.33, door_part_w*0.67]) {
        translate([x, 8, -eps])
          heat_insert_hole(h=door_t+1);
      }
    }

    // Rack mounting holes only on lower row.
    if (row == "lower") {
      for (x=[35, 85, 125]) {
        translate([x, 24, -eps]) heat_insert_hole(h=door_t+1);
      }
    }
  }
}
