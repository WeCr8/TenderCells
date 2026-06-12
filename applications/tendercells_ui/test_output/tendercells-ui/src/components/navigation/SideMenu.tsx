// SideMenu.tsx
import React from "react";
import List from "@mui/material/List";
import SideMenuItem from "./SideMenuItem";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import LockIcon from "@mui/icons-material/Lock";
import BuildIcon from "@mui/icons-material/Build";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import SensorsIcon from "@mui/icons-material/Sensors";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EggIcon from "@mui/icons-material/Egg";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TuneIcon from "@mui/icons-material/Tune";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DevicesIcon from "@mui/icons-material/Devices";
import GridOnIcon from "@mui/icons-material/GridOn";
import DescriptionIcon from "@mui/icons-material/Description";
import PoolIcon from "@mui/icons-material/Pool";
import FenceIcon from "@mui/icons-material/Fence";
import ExploreIcon from "@mui/icons-material/Explore";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import WaterIcon from "@mui/icons-material/Water";
import TrainIcon from "@mui/icons-material/Train";
import SecurityIcon from "@mui/icons-material/Security";

type SideMenuProps = {
  activeSection?: string;
  product?: string;
};

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
};

const PRODUCT_ITEMS: Record<string, MenuItem[]> = {
  "chicken-tender": [
  { id: "coop", label: "Coop Settings", icon: <HomeIcon />, path: "/chicken-tender" },
  { id: "doors", label: "Doors & Latches", icon: <LockIcon />, path: "/chicken-tender" },
  { id: "motors", label: "Motors & Rails", icon: <BuildIcon />, path: "/chicken-tender" },
  { id: "robot", label: "Robot Arm", icon: <PrecisionManufacturingIcon />, path: "/chicken-tender" },
  { id: "sensors", label: "Sensors", icon: <SensorsIcon />, path: "/chicken-tender" },
  { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon />, path: "/chicken-tender" },
  { id: "waste", label: "Waste Cleaning", icon: <CleaningServicesIcon />, path: "/chicken-tender" },
  { id: "eggs", label: "Egg Map", icon: <EggIcon />, path: "/chicken-tender" },
  ],
  "roaming-roost": [
    { id: "mobile-coop", label: "Mobile Coop", icon: <HomeIcon /> },
    { id: "route", label: "Route Planning", icon: <ExploreIcon /> },
    { id: "doors", label: "Doors & Latches", icon: <LockIcon /> },
    { id: "sensors", label: "Sensors", icon: <SensorsIcon /> },
    { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon /> },
  ],
  "duck-dock": [
    { id: "dock", label: "Dock Settings", icon: <HomeIcon /> },
    { id: "pond", label: "Pond Level", icon: <PoolIcon /> },
    { id: "water", label: "Water Quality", icon: <WaterIcon /> },
    { id: "feed", label: "Feeding", icon: <RestaurantIcon /> },
    { id: "eggs", label: "Nest Map", icon: <EggIcon /> },
  ],
  "goat-guardian": [
    { id: "shelter", label: "Shelter", icon: <HomeIcon /> },
    { id: "fence", label: "Fence Status", icon: <FenceIcon /> },
    { id: "pasture", label: "Grazing Area", icon: <GridOnIcon /> },
    { id: "security", label: "Predator Alert", icon: <SecurityIcon /> },
    { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon /> },
  ],
  "bunny-burrow": [
    { id: "shelter", label: "Burrow Housing", icon: <HomeIcon /> },
    { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon /> },
    { id: "sensors", label: "Climate Sensors", icon: <SensorsIcon /> },
    { id: "security", label: "Safety Alerts", icon: <SecurityIcon /> },
  ],
  "turkey-tower": [
    { id: "shelter", label: "Tower Housing", icon: <HomeIcon /> },
    { id: "doors", label: "Doors & Latches", icon: <LockIcon /> },
    { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon /> },
    { id: "sensors", label: "Sensors", icon: <SensorsIcon /> },
    { id: "security", label: "Predator Alert", icon: <SecurityIcon /> },
  ],
  "predator-monitor": [
    { id: "watchtower", label: "WatchTower", icon: <SecurityIcon /> },
    { id: "cameras", label: "Cameras", icon: <CameraAltIcon /> },
    { id: "detections", label: "Detections", icon: <SensorsIcon /> },
    { id: "alerts", label: "Alerts", icon: <LockIcon /> },
  ],
  "rail-system-modules": [
    { id: "rails", label: "Rails", icon: <TrainIcon /> },
    { id: "motors", label: "Motors", icon: <BuildIcon /> },
    { id: "robot", label: "Robot Arm", icon: <PrecisionManufacturingIcon /> },
    { id: "sensors", label: "Sensors", icon: <SensorsIcon /> },
  ],
  "tender-cells-cloud": [
    { id: "alerts", label: "Alerts", icon: <LockIcon /> },
    { id: "detections", label: "Models & Data", icon: <SensorsIcon /> },
    { id: "cameras", label: "Remote Streams", icon: <CameraAltIcon /> },
    { id: "sensors", label: "Telemetry", icon: <SensorsIcon /> },
  ],
  "pigeon-palace": [
    { id: "coop", label: "Loft Settings", icon: <HomeIcon /> },
    { id: "doors", label: "Access Doors", icon: <LockIcon /> },
    { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon /> },
    { id: "eggs", label: "Nest Map", icon: <EggIcon /> },
    { id: "sensors", label: "Sensors", icon: <SensorsIcon /> },
  ],
};

const SHARED_ITEMS: MenuItem[] = [
  { id: "schedules", label: "Schedules", icon: <ScheduleIcon />, path: "/schedules" },
  { id: "products", label: "Products", icon: <DevicesIcon />, path: "/products" },
  { id: "specs", label: "Product Specs", icon: <DescriptionIcon />, path: "/specs" },
  { id: "layout", label: "Property Layout", icon: <GridOnIcon />, path: "/layout" },
  { id: "custom", label: "Custom Settings", icon: <TuneIcon />, path: "/settings" },
  { id: "account", label: "Account", icon: <AccountCircleIcon />, path: "/account" },
];

export default function SideMenu({ activeSection, product = "chicken-tender" }: SideMenuProps) {
  const navigate = useNavigate();

  // Update paths based on current product
  const items = [...(PRODUCT_ITEMS[product] || PRODUCT_ITEMS["chicken-tender"]), ...SHARED_ITEMS];

  const getPath = (item: MenuItem) => {
    if (item.path && item.path !== `/${product}`) {
      return item.path;
    }

    return `/${product}?section=${item.id}`;
  };

  return (
    <nav>
      <List dense>
        {items.map((item) => (
          <SideMenuItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={activeSection === item.id}
            onClick={() => navigate(getPath(item))}
          />
        ))}
      </List>
    </nav>
  );
}
