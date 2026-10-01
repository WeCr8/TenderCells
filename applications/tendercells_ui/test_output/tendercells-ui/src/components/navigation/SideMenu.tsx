import React from "react";
import { Divider, List, ListSubheader } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import ConstructionIcon from "@mui/icons-material/Construction";
import BugReportIcon from "@mui/icons-material/BugReport";
import FlagIcon from "@mui/icons-material/Flag";
import BuildIcon from "@mui/icons-material/Build";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DevicesIcon from "@mui/icons-material/Devices";
import EggIcon from "@mui/icons-material/Egg";
import ExtensionIcon from "@mui/icons-material/Extension";
import ExploreIcon from "@mui/icons-material/Explore";
import FenceIcon from "@mui/icons-material/Fence";
import GrassIcon from "@mui/icons-material/Grass";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import GridOnIcon from "@mui/icons-material/GridOn";
import HomeIcon from "@mui/icons-material/Home";
import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HandymanIcon from "@mui/icons-material/Handyman";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import PetsIcon from "@mui/icons-material/Pets";
import PoolIcon from "@mui/icons-material/Pool";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SecurityIcon from "@mui/icons-material/Security";
import SensorsIcon from "@mui/icons-material/Sensors";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import TrainIcon from "@mui/icons-material/Train";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TuneIcon from "@mui/icons-material/Tune";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WaterIcon from "@mui/icons-material/Water";
import SideMenuItem from "./SideMenuItem";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../types/products";

type SideMenuProps = { activeSection?: string; product?: string };
type MenuItem = { id: string; label: string; icon: React.ReactNode; path?: string };
export type MenuGroup = { label: string; items: MenuItem[] };

const PRODUCT_ITEMS: Record<string, MenuItem[]> = {
  "chicken-tender": [
    ["coop", "Coop Settings", <HomeIcon />], ["doors", "Doors & Latches", <LockIcon />],
    ["motors", "Motors & Rails", <BuildIcon />], ["robot", "Robot Arm", <PrecisionManufacturingIcon />],
    ["sensors", "Sensors", <SensorsIcon />], ["feed", "Feeding & Water", <RestaurantIcon />],
    ["waste", "Waste Cleaning", <CleaningServicesIcon />], ["eggs", "Egg Map", <EggIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon, path: "/chicken-tender" })),
  "roaming-roost": [
    ["mobile-coop", "Mobile Coop", <HomeIcon />], ["route", "Route Planning", <ExploreIcon />],
    ["doors", "Doors & Latches", <LockIcon />], ["sensors", "Sensors", <SensorsIcon />],
    ["feed", "Feeding & Water", <RestaurantIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "duck-dock": [
    ["dock", "Dock Settings", <HomeIcon />], ["pond", "Pond Level", <PoolIcon />],
    ["water", "Water Quality", <WaterIcon />], ["feed", "Feeding", <RestaurantIcon />],
    ["eggs", "Nest Map", <EggIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "goat-guardian": [
    ["shelter", "Shelter", <HomeIcon />], ["fence", "Fence Status", <FenceIcon />],
    ["pasture", "Grazing Area", <GridOnIcon />], ["security", "Predator Alert", <SecurityIcon />],
    ["feed", "Feeding & Water", <RestaurantIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "bunny-burrow": [
    ["shelter", "Burrow Housing", <HomeIcon />], ["feed", "Feeding & Water", <RestaurantIcon />],
    ["sensors", "Climate Sensors", <SensorsIcon />], ["security", "Safety Alerts", <SecurityIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "turkey-tower": [
    ["shelter", "Tower Housing", <HomeIcon />], ["doors", "Doors & Latches", <LockIcon />],
    ["feed", "Feeding & Water", <RestaurantIcon />], ["sensors", "Sensors", <SensorsIcon />],
    ["security", "Predator Alert", <SecurityIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "predator-monitor": [
    ["watchtower", "WatchTower", <SecurityIcon />], ["cameras", "Cameras", <CameraAltIcon />],
    ["detections", "Detections", <SensorsIcon />], ["alerts", "Alerts", <LockIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "rail-system-modules": [
    ["rails", "Rails", <TrainIcon />], ["motors", "Motors", <BuildIcon />],
    ["robot", "Robot Arm", <PrecisionManufacturingIcon />], ["sensors", "Sensors", <SensorsIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "tender-cells-cloud": [
    ["alerts", "Alerts", <LockIcon />], ["detections", "Models & Data", <SensorsIcon />],
    ["cameras", "Remote Streams", <CameraAltIcon />], ["sensors", "Telemetry", <SensorsIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
  "pigeon-palace": [
    ["coop", "Loft Settings", <HomeIcon />], ["doors", "Access Doors", <LockIcon />],
    ["feed", "Feeding & Water", <RestaurantIcon />], ["eggs", "Nest Map", <EggIcon />],
    ["sensors", "Sensors", <SensorsIcon />],
  ].map(([id, label, icon]) => ({ id: String(id), label: String(label), icon })),
};

const CORE: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { id: "simulator", label: "Trigger an Event", icon: <BoltIcon />, path: "/simulator" },
  { id: "builder", label: "Builder", icon: <ConstructionIcon />, path: "/builder" },
  { id: "missions", label: "Missions", icon: <FlagIcon />, path: "/missions" },
  { id: "resources", label: "Resources", icon: <MenuBookIcon />, path: "/resources" },
  { id: "library", label: "Animal & Plant Library", icon: <LocalLibraryIcon />, path: "/library" },
  { id: "projects", label: "DIY Projects", icon: <HandymanIcon />, path: "/projects" },
  { id: "products", label: "Products & Devices", icon: <DevicesIcon />, path: "/products" },
  { id: "layout", label: "Property Twin", icon: <GridOnIcon />, path: "/layout" },
  { id: "setup", label: "Add Device", icon: <AddCircleOutlineIcon />, path: "/products?register=1" },
];
const OPERATIONS: MenuItem[] = [
  { id: "analytics", label: "Analytics", icon: <TrendingUpIcon />, path: "/analytics" },
  { id: "diagnostics", label: "Diagnostics", icon: <BugReportIcon />, path: "/diagnostics" },
  { id: "schedules", label: "Schedules", icon: <ScheduleIcon />, path: "/schedules" },
];
const ACCOUNT: MenuItem[] = [
  { id: "custom", label: "Settings", icon: <TuneIcon />, path: "/settings" },
  { id: "account", label: "Account", icon: <AccountCircleIcon />, path: "/account" },
  { id: "assistants", label: "Claude & ChatGPT", icon: <ExtensionIcon />, path: "/assistants" },
];
const familyOf = (product: Product) => String(product.metadata?.product_family || "");

function buildMenuGroups(products: Product[], currentProduct: string): MenuGroup[] {
  const families = new Set(products.map(familyOf).filter(Boolean));
  const hasProducts = products.length > 0;
  const groups: MenuGroup[] = [{ label: "Workspace", items: CORE }];
  if (families.has(currentProduct) && PRODUCT_ITEMS[currentProduct]) groups.push({ label: "Current Product", items: PRODUCT_ITEMS[currentProduct] });
  if (hasProducts) groups.push({ label: "Operations", items: OPERATIONS });

  const diyItems = products
    .filter((item) => item.product_type === "custom_product" || item.metadata?.build_source === "open-source-diy")
    .map((item) => ({
      id: `product-${item.id}`,
      label: item.product_name,
      icon: <BuildIcon />,
      path: `/product/${encodeURIComponent(item.id)}`,
    }));
  if (diyItems.length) groups.push({ label: "DIY Modules", items: diyItems });

  const care: MenuItem[] = [
    { id: "birds", label: "Animal Roster", icon: <PetsIcon />, path: "/animals" },
  ];
  if (families.has("chicken-tender")) care.push({ id: "chicken-eye", label: "ChickenEye AI", icon: <VisibilityIcon />, path: "/chicken-eye" });
  if (hasProducts) care.push({ id: "ai", label: "TenderAI", icon: <SmartToyIcon />, path: "/ai" });
  if (families.has("roaming-roost") || families.has("rail-system-modules")) care.push({ id: "weed-patrol", label: "Weed Patrol", icon: <GrassIcon />, path: "/weed-patrol" });
  // Bring-your-own robot mowers (any family - a mower is useful before any Tender Cells product).
  care.push({ id: "mowers", label: "Robot Mowers", icon: <AgricultureIcon />, path: "/mowers" });
  if (care.length) groups.push({ label: "Care & Automation", items: care });
  groups.push({ label: "Account", items: ACCOUNT });
  return groups;
}

export default function SideMenu({ activeSection, product = "chicken-tender" }: SideMenuProps) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const getPath = (item: MenuItem) => item.path && item.path !== `/${product}` ? item.path : `/${product}?section=${item.id}`;
  return (
    <nav aria-label="Application navigation">
      <List dense disablePadding>
        {buildMenuGroups(products, product).map((group, index) => (
          <React.Fragment key={group.label}>
            {index > 0 && <Divider sx={{ mx: 2, my: 1, borderColor: "#1F5C3B" }} />}
            <ListSubheader disableSticky sx={{ bgcolor: "transparent", color: "#6F8E82", fontSize: 11, lineHeight: "28px", textTransform: "uppercase" }}>{group.label}</ListSubheader>
            {group.items.map((item) => <SideMenuItem key={item.id} label={item.label} icon={item.icon} active={activeSection === item.id} onClick={() => navigate(getPath(item))} />)}
          </React.Fragment>
        ))}
      </List>
    </nav>
  );
}
