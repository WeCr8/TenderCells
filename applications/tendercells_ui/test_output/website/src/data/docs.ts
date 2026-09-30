// docs.ts - the current documentation and build guides, grouped, for the Learn and
// Education pages. `path` is a repo path (shown on GitHub) unless `to` is a page on this
// site. scripts/check-links.mjs fails CI when a path no longer exists in the repo.

export const GITHUB_BLOB = "https://github.com/WeCr8/TenderCells/blob/main";

export interface DocLink {
  title: string;
  desc: string;
  /** Repo path, e.g. "docs/WEED_PATROL.md" (opens on GitHub). */
  path?: string;
  /** A page on this website instead. */
  to?: string;
}

export const docHref = (d: DocLink): string => d.to ?? `${GITHUB_BLOB}/${d.path}`;

export const DOC_GROUPS: { id: string; title: string; docs: DocLink[] }[] = [
  {
    id: "build-guides",
    title: "Build guides",
    docs: [
      { title: "Camera Node: first build", desc: "Seeed XIAO ESP32-S3 camera node: parts, wiring, flashing, registering it in the OS.", to: "/guides/camera-node-first-build" },
      { title: "Flash a device", desc: "Flash starter, camera and Chicken Tender firmware from the browser (USB, Chrome / Edge).", to: "/flash" },
      { title: "Connect a device", desc: "Run a real device path with no hardware, a simulated device, or a board on your desk.", path: "docs/CONNECT_A_DEVICE.md" },
      { title: "Motors, axis & drives testing", desc: "Bench-test NEMA 23 steppers, DM542T drivers and gantry axes safely.", path: "docs/HARDWARE_TESTING_MOTORS.md" },
      { title: "Device testing setup", desc: "Register and test Chicken Tender hardware while software and CAD develop in parallel.", path: "docs/DEVICE_TESTING_SETUP.md" },
      { title: "Hardware catalog", desc: "Every part: structure, fasteners, doors, motion, sensors, solar, networking, vendors.", path: "docs/CHICKEN_TENDER_HARDWARE_CATALOG.md" },
      { title: "Weed patrol (bed + rover)", desc: "Weed-finding robots: camera scout or laser, animal and leak checks, laser safety.", path: "docs/WEED_PATROL.md" },
      { title: "Robot arm service", desc: "Simulated, Universal Robots and LeRobot arms over MQTT; Hugging Face policies.", path: "docs/ARM_SERVICE.md" },
      { title: "DIY habitat projects", desc: "Terrarium climate, enclosure camera, sound monitor, pond and activity-wheel builds.", path: "docs/DIY_HABITAT_PROJECTS.md" },
      { title: "NVIDIA Isaac Sim", desc: "Export your property to USD, drive the arm in simulation, make synthetic weed data.", path: "docs/ISAAC_SIM.md" },
    ],
  },
  {
    id: "reference",
    title: "Reference",
    docs: [
      { title: "Usage guide", desc: "What the OS does today, page by page, for homesteads, schools and makers.", path: "docs/USAGE.md" },
      { title: "Backend API (XML)", desc: "Every REST endpoint and MQTT topic in one machine-readable file.", to: "/api/tendercells-backend.xml" },
      { title: "Machine-readable backend", desc: "How the XML is made and how tools and LLMs can use it.", path: "docs/MACHINE_READABLE_BACKEND.md" },
      { title: "Robot exclusion zones", desc: "No-go, keep-out and no-laser zones: how robots are kept out of restricted areas.", path: "docs/ROBOT_EXCLUSION_ZONES.md" },
      { title: "Property map layers", desc: "Terrain, elevation, drainage, detections and camera layers on the 2D / 3D map.", path: "docs/PROPERTY_MAP_LAYERS.md" },
      { title: "Control types & arm plan", desc: "Every control type the OS supports, printing tactics and the robot-arm plan.", path: "docs/CONTROL_TYPES_AND_ARM_PLAN.md" },
      { title: "Chicken Tender master spec", desc: "Product requirements: sizes, zones, robot safety, cloud, manufacturing.", path: "docs/CHICKEN_TENDER_MASTER_SPEC.md" },
      { title: "Firmware source", desc: "ESP32 and Jetson code for every device, built with PlatformIO.", to: "https://github.com/WeCr8/TenderCells/tree/main/firmware" },
      { title: "All docs", desc: "The documentation index in the repository.", path: "docs/README.md" },
    ],
  },
  {
    id: "schools-docs",
    title: "Schools & teachers",
    docs: [
      { title: "Classroom Quickstart", desc: "Run a simulated smart coop on a laptop in 5 minutes - no hardware, no accounts.", to: "/lessons/classroom-quickstart" },
      { title: "Learning tracks", desc: "The full curriculum: five tiers, every project and its build status.", to: "/lessons/learning-tracks" },
      { title: "Schools: sign-in and IT setup", desc: "School-code sign-in, Google / Microsoft admin steps and the pilot form.", to: "/schools" },
      { title: "School network & device enrollment", desc: "Enroll classroom devices without sharing production Wi-Fi credentials.", path: "docs/SCHOOL_IT_NETWORK_AND_DEVICE_ENROLLMENT.md" },
      { title: "School platform operations", desc: "Organizations, classes, rosters and subscriptions for districts.", path: "docs/SCHOOL_PLATFORM_OPERATIONS.md" },
      { title: "Lesson template", desc: "Write a new lesson in the same LEGO-style format.", path: "docs/lessons/_TEMPLATE.md" },
    ],
  },
];
