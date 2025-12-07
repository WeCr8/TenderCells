"""


TenderCells Unified UI with Multi-Product Backend Support


"""





import os


import argparse


import sys


from typing import Dict, List, Callable, Optional


from dataclasses import dataclass


from pathlib import Path








# ============================================================


# CORE FRAMEWORK


# ============================================================





@dataclass


class FileTemplate:


    """Represents a file template with content generation."""


    path: str


    content: str | Callable[[], str]


    skip_if_exists: bool = True





    def get_content(self) -> str:


        """Get the file content, calling the generator if needed."""


        if callable(self.content):


            return self.content()


        return self.content








class ProjectGenerator:


    """Main generator class for creating project structures."""


    


    def __init__(self, project_name: str = "project"):


        self.project_name = project_name


        self.directories: List[str] = []


        self.templates: List[FileTemplate] = []


        


    def add_directories(self, dirs: List[str]) -> 'ProjectGenerator':


        """Add directories to create."""


        self.directories.extend(dirs)


        return self


    


    def add_template(self, path: str, content: str | Callable, 


                     skip_if_exists: bool = True) -> 'ProjectGenerator':


        """Add a file template."""


        self.templates.append(FileTemplate(path, content, skip_if_exists))


        return self


    


    def add_templates(self, templates: Dict[str, str | Callable], 


                      base_path: str = "") -> 'ProjectGenerator':


        """Add multiple templates from a dictionary."""


        for path, content in templates.items():


            full_path = os.path.join(base_path, path) if base_path else path


            self.add_template(full_path, content)


        return self


    


    def generate(self, verbose: bool = True) -> None:


        """Execute the generation process."""


        if verbose:


            print(f"\n🚀 Generating {self.project_name} scaffolding...\n")


        


        self._create_directories(verbose)


        self._create_files(verbose)


        


        if verbose:


            print(f"\n✅ {self.project_name} scaffolding complete!\n")


    


    def _create_directories(self, verbose: bool) -> None:


        """Create all directories."""


        for directory in self.directories:


            Path(directory).mkdir(parents=True, exist_ok=True)


            if verbose:


                print(f"📁 Created: {directory}")


    


    def _create_files(self, verbose: bool) -> None:


        """Create all template files."""


        for template in self.templates:


            if template.skip_if_exists and os.path.exists(template.path):


                if verbose:


                    print(f"⏩ Skipping: {template.path}")


                continue


            


            # Ensure parent directory exists


            parent = os.path.dirname(template.path)


            if parent:


                Path(parent).mkdir(parents=True, exist_ok=True)


            


            # Write file


            content = template.get_content()


            with open(template.path, "w", encoding="utf-8") as f:


                f.write(content.strip() + "\n")
            


            if verbose:


                print(f"📄 Created: {template.path}")








# ============================================================


# TEMPLATE GENERATORS


# ============================================================





class TemplateGenerators:


    """Factory for common template content generators."""


    


    @staticmethod


    def react_component(name: str, props: Optional[str] = None) -> str:


        """Generate a React component template."""


        props_type = f"type {name}Props = {props};\n\n\n\n" if props else ""


        props_param = f"{{ }}: {name}Props" if props else ""


        


        return f"""// {name}.tsx


import React from "react";





{props_type}export default function {name}({props_param}) {{


  return (


    <div>{name}</div>


  );


}}"""


    


    @staticmethod


    def material_component(name: str, material_imports: str, content: str) -> str:


        """Generate a Material-UI component template."""


        return f"""// {name}.tsx


import React from "react";


{material_imports}





export default function {name}() {{


  return (


{content}


  );


}}"""


    


    @staticmethod


    def typescript_interface(name: str, fields: Dict[str, str]) -> str:


        """Generate a TypeScript interface."""


        field_lines = "\n".join(f" {k}: {v};" for k, v in fields.items())


        return f"""// {name}.ts





export interface {name} {{


{field_lines}


}}"""


    


    @staticmethod


    def express_router(name: str, routes: List[tuple]) -> str:


        """Generate an Express router template."""


        route_lines = "


".join(


            f'router.{method}("{path}", controller.{handler});'


            for method, path, handler in routes


        )


        return f"""// {name}.routes.ts


import {{ Router }} from "express";


import * as controller from "./{name}.controller";





const router = Router();





{route_lines}





export default router;"""


    


    @staticmethod


    def express_service(name: str, entity: str) -> str:


        """Generate an Express service template."""


        return f"""// {name}.service.ts


interface {entity} {{


  id: string;


  [key: string]: any;


}}





const items: {entity}[] = [];





export async function list(): Promise<{entity}[]> {{


  return items;


}}





export async function getById(id: string): Promise<{entity} | undefined> {{


  return items.find(item => item.id === id);


}}





export async function create(data: Partial<{entity}>): Promise<{entity}> {{


  const item: {entity} = {{


    id: `{name}_${{Date.now()}}`,


    ...data,


  }};


  items.push(item);


  return item;


}}"""








# ============================================================


# DIRECTORY STRUCTURE BUILDERS


# ============================================================





class DirectoryStructure:


    """Builders for common directory structures."""


    


    @staticmethod


    def react_app(base: str = "src") -> List[str]:


        """Generate a typical React app structure plus feature dirs."""


        return [


            base,


            f"{base}/components",


            f"{base}/components/layout",


            f"{base}/components/navigation",


            f"{base}/components/viewport",


            f"{base}/components/telemetry",


            f"{base}/components/toolbar",


            f"{base}/components/menu-sections",


            f"{base}/components/chicken-eye",


            f"{base}/components/chicken-eye/cameras",


            f"{base}/components/chicken-eye/birds",


            f"{base}/components/chicken-eye/insights",


            f"{base}/components/chicken-eye/bird-management",


            f"{base}/components/cnc",


            f"{base}/components/analytics",


            f"{base}/components/maintenance",


            f"{base}/components/overlays",


            f"{base}/components/safety",


            f"{base}/components/notifications",


            f"{base}/components/help",


            f"{base}/components/common",


            f"{base}/hooks",


            f"{base}/hooks/chicken-eye",


            f"{base}/context",


            f"{base}/icons",


            f"{base}/lib",


            f"{base}/lib/firebase",


            f"{base}/automation",


            f"{base}/automation/devices",


            f"{base}/automation/rules",


            f"{base}/automation/schedules",


            f"{base}/automation/safety",


            f"{base}/automation/automationContext",


            f"{base}/automation/birds",


            f"{base}/pages",


            f"{base}/routes",


            f"{base}/types",


            f"{base}/styles",


            f"{base}/models",


            f"{base}/models/presets",


            f"{base}/models/loaders",


            f"{base}/services",


            f"{base}/services/connectivity",


            f"{base}/services/hardware",


            f"{base}/assets",


            f"{base}/public",


            f"{base}/tests",


            f"{base}/tests/e2e",


        ]


    


    @staticmethod


    def express_api(base: str = "backend/src") -> List[str]:


        """Generate Express API structure with modules."""


        return [


            base,


            f"{base}/config",


            f"{base}/routes",


            f"{base}/controllers",


            f"{base}/services",


            f"{base}/models",


            f"{base}/middleware",


            f"{base}/utils",


            f"{base}/types",


            f"{base}/modules",


            f"{base}/modules/coops",


            f"{base}/modules/birds",


            f"{base}/modules/automation",


            f"{base}/modules/connectivity",


            f"{base}/modules/connectivity/ble",


            f"{base}/modules/connectivity/wifi",


            f"{base}/modules/connectivity/mqtt",


            f"{base}/modules/connectivity/websocket",


            f"{base}/modules/hardware",


            f"{base}/modules/hardware/sensors",


            f"{base}/modules/hardware/actuators",


            f"{base}/modules/integrations",


            f"{base}/modules/integrations/weather",


            f"{base}/modules/integrations/notifications",


        ]








# ============================================================


# TENDERCELLS UNIFIED UI CONFIGURATION


# ============================================================





def build_tendercells_ui_project() -> ProjectGenerator:


    """Build the unified TenderCells UI project structure."""


    


    gen = ProjectGenerator("TenderCells UI")


    


    # Frontend structure


    frontend_base = "src"


    gen.add_directories(DirectoryStructure.react_app(frontend_base))


    


    # Unified UI templates


    add_unified_frontend_templates(gen, frontend_base)


    


    # Root files, env, Firebase


    add_root_files(gen, "tendercells")


    


    # PWA, analytics, error tracking


    add_pwa_analytics_error_tracking(gen)


    


    # E2E testing templates


    add_e2e_testing_templates(gen)


    


    return gen








# ============================================================


# UNIFIED FRONTEND TEMPLATES


# ============================================================





def add_unified_frontend_templates(gen: ProjectGenerator, base: str) -> None:


    """Add unified UI templates with dynamic product routing."""


    


    # Main entry with Material theme (unified main color)


    main_color = "#6750A4" # Unified main color for all products


    gen.add_template(f"{base}/main.tsx", f"""// main.tsx


import React from "react";


import ReactDOM from "react-dom/client";


import App from "./App";


import {{ ThemeProvider, CssBaseline, createTheme }} from "@mui/material";





const theme = createTheme({{


  palette: {{


    mode: "dark",


    primary: {{ main: "{main_color}" }},


    secondary: {{ main: "#625B71" }},


  }},


}});





ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(


  <React.StrictMode>


    <ThemeProvider theme={{theme}}>


      <CssBaseline />


      <App />


    </ThemeProvider>


  </React.StrictMode>


);""")


    


    # Layout components (Material)


    gen.add_template(


        f"{base}/components/layout/MainLayout.tsx",


        """// MainLayout.tsx


import React from "react";


import TopNavBar from "./TopNavBar";


import Container from "@mui/material/Container";





type MainLayoutProps = {


  title?: string;


  children: React.ReactNode;


};





export default function MainLayout({ title, children }: MainLayoutProps) {


  return (


    <div className="app-root">


      <TopNavBar title={title} />


      <Container maxWidth="xl" sx={{ py: 2 }}>


        {children}


      </Container>


    </div>


  );


}"""


    )


    


    gen.add_template(


        f"{base}/components/layout/TopNavBar.tsx",


        """// TopNavBar.tsx


import React from "react";


import AppBar from "@mui/material/AppBar";


import Toolbar from "@mui/material/Toolbar";


import Typography from "@mui/material/Typography";


import Button from "@mui/material/Button";


import Select from "@mui/material/Select";


import MenuItem from "@mui/material/MenuItem";





type TopNavBarProps = {


  title?: string;


  product: string;


  onProductChange: (product: string) => void;


};





export default function TopNavBar({ title, product, onProductChange }: TopNavBarProps) {


  return (


    <AppBar position="static" color="primary" enableColorOnDark>


      <Toolbar>


        <Typography variant="h6" sx={{ flexGrow: 1 }}>


          TENDER CELLS {title ? `| ${title}` : "| DASHBOARD"}


        </Typography>


        <Select


          value={product}


          onChange={(e) => onProductChange(e.target.value)}


          sx={{ mr: 1 }}


        >


          <MenuItem value="chicken-tender">Chicken Tender</MenuItem>


          <MenuItem value="roaming-roost">Roaming Roost</MenuItem>


          <MenuItem value="duck-dock">Duck Dock</MenuItem>


          <MenuItem value="goat-guardian">Goat Guardian</MenuItem>


          <MenuItem value="bunny-burrow">Bunny Burrow</MenuItem>


          <MenuItem value="turkey-tower">Turkey Tower</MenuItem>


          <MenuItem value="predator-monitor">Predator Monitor</MenuItem>


          <MenuItem value="rail-system-modules">Rail System Modules</MenuItem>


          <MenuItem value="tender-cells-cloud">TenderCells Cloud</MenuItem>


          <MenuItem value="pigeon-palace">Pigeon Palace</MenuItem>


        </Select>


        <Button


          variant="outlined"


          color="error"


          size="small"


          sx={{ mr: 1 }}


        >


          E-STOP


        </Button>


        <Button


          variant="contained"


          color="error"


          size="small"


        >


          E-STOP


        </Button>


      </Toolbar>


    </AppBar>


  );


}"""


    )


    


    # Product selector and routing


    gen.add_template(


        f"{base}/App.tsx",


        """// App.tsx


import React, { useState, useEffect } from "react";


import SplashScreen from "./components/SplashScreen";


import MainLayout from "./components/layout/MainLayout";


import { Routes, Route, useNavigate } from "react-router-dom";


import { ChickenTenderDashboard, RoamingRoostDashboard, DuckDockDashboard, GoatGuardianDashboard, BunnyBurrowDashboard, TurkeyTowerDashboard, PredatorMonitorDashboard, RailSystemModulesDashboard, TenderCellsCloudDashboard, PigeonPalaceDashboard, SettingsPage, AccountPage } from "./pages";





function App() {


  const [product, setProduct] = useState("chicken-tender");


  const [showSplash, setShowSplash] = useState(true);





  useEffect(() => {


    const timer = setTimeout(() => {


      setShowSplash(false);


    }, 2000); // Splash screen duration





    return () => clearTimeout(timer);


  }, []);





  const handleProductChange = (newProduct: string) => {


    setProduct(newProduct);


  };





  if (showSplash) {


    return <SplashScreen />;


  }





  return (


    <MainLayout title={product}>


      <Routes>


        <Route path="/chicken-tender" element={<ChickenTenderDashboard />} />


        <Route path="/roaming-roost" element={<RoamingRoostDashboard />} />


        <Route path="/duck-dock" element={<DuckDockDashboard />} />


        <Route path="/goat-guardian" element={<GoatGuardianDashboard />} />


        <Route path="/bunny-burrow" element={<BunnyBurrowDashboard />} />


        <Route path="/turkey-tower" element={<TurkeyTowerDashboard />} />


        <Route path="/predator-monitor" element={<PredatorMonitorDashboard />} />


        <Route path="/rail-system-modules" element={<RailSystemModulesDashboard />} />


        <Route path="/tender-cells-cloud" element={<TenderCellsCloudDashboard />} />


        <Route path="/pigeon-palace" element={<PigeonPalaceDashboard />} />


        <Route path="/settings" element={<SettingsPage />} />


        <Route path="/account" element={<AccountPage />} />


      </Routes>


    </MainLayout>


  );


}





export default App;"""


    )


    


    # Splash screen component


    gen.add_template(


        f"{base}/components/SplashScreen.tsx",


        """// SplashScreen.tsx


import React from "react";


import Box from "@mui/material/Box";


import Typography from "@mui/material/Typography";


import { CircularProgress } from "@mui/material";





export default function SplashScreen() {


  return (


    <Box


      sx={{


        display: "flex",


        flexDirection: "column",


        alignItems: "center",


        justifyContent: "center",


        height: "100vh",


        backgroundColor: "#6750A4",


        color: "white",


      }}


    >


      <img src="/assets/logo.png" alt="TenderCells Logo" style={{ width: "200px", marginBottom: "20px" }} />


      <Typography variant="h4">TenderCells</Typography>


      <CircularProgress sx={{ mt: 2, color: "white" }} />


    </Box>


  );


}"""


    )


    


    # Product-specific pages


    products = [


        "ChickenTender", "RoamingRoost", "DuckDock", "GoatGuardian", "BunnyBurrow",


        "TurkeyTower", "PredatorMonitor", "RailSystemModules", "TenderCellsCloud", "PigeonPalace"


    ]


    for product in products:


        gen.add_template(


            f"{base}/pages/{product}Dashboard.tsx",


            f"""// {product}Dashboard.tsx


import React from "react";





export default function {product}Dashboard() {{


  return <div>{product} Dashboard</div>;


}}"""


        )


    


    # Settings page


    gen.add_template(


        f"{base}/pages/SettingsPage.tsx",


        """// SettingsPage.tsx


import React from "react";


import { Box, Typography, TextField, Button } from "@mui/material";





export default function SettingsPage() {


  return (


    <Box sx={{ p: 3 }}>


      <Typography variant="h5" gutterBottom>Settings</Typography>


      <TextField label="Device Name" fullWidth margin="normal" />


      <TextField label="WiFi SSID" fullWidth margin="normal" />


      <TextField label="WiFi Password" fullWidth margin="normal" />


      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Save Settings</Button>


    </Box>


  );


}"""


    )


    


    # Account page


    gen.add_template(


        f"{base}/pages/AccountPage.tsx",


        """// AccountPage.tsx


import React from "react";


import { Box, Typography, TextField, Button } from "@mui/material";





export default function AccountPage() {


  return (


    <Box sx={{ p: 3 }}>


      <Typography variant="h5" gutterBottom>Account</Typography>


      <TextField label="Email" fullWidth margin="normal" />


      <TextField label="Password" fullWidth margin="normal" />


      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Update Account</Button>


    </Box>


  );


}"""


    )


    


    # Add more product-specific pages as needed


    # ...


    


    # Reusable action primitives


    gen.add_template(


        f"{base}/components/common/ActionButton.tsx",


        """// ActionButton.tsx


import React from "react";


import Button, { ButtonProps } from "@mui/material/Button";


import SaveIcon from "@mui/icons-material/Save";


import CloseIcon from "@mui/icons-material/Close";


import DeleteIcon from "@mui/icons-material/Delete";


import EditIcon from "@mui/icons-material/Edit";





export type ActionKind = "primary" | "secondary" | "danger" | "ghost";


export type ActionIcon = "save" | "close" | "delete" | "edit" | "none";





export interface ActionButtonProps extends ButtonProps {


  kind?: ActionKind;


  icon?: ActionIcon;


  label: string;


}





function resolveIcon(icon: ActionIcon) {


  switch (icon) {


    case "save":


      return <SaveIcon fontSize="small" />;


    case "close":


      return <CloseIcon fontSize="small" />;


    case "delete":


      return <DeleteIcon fontSize="small" />;


    case "edit":


      return <EditIcon fontSize="small" />;


    default:


      return null;


  }


}





export default function ActionButton({


  kind = "primary",


  icon = "none",


  label,


  ...rest


}: ActionButtonProps) {


  const color =


    kind === "danger" ? "error" : kind === "secondary" ? "secondary" : "primary";


  const variant =


    kind === "ghost" ? "text" : kind === "secondary" ? "outlined" : "contained";





  const startIcon = icon !== "none" ? resolveIcon(icon) : undefined;





  return (


    <Button


      color={color}


      variant={variant}


      size="small"


      startIcon={startIcon}


      {...rest}


    >


      {label}


    </Button>


  );


}"""


    )


    


    # Navigation


    gen.add_template(


        f"{base}/components/navigation/SideMenuItem.tsx",


        """// SideMenuItem.tsx


import React from "react";


import ListItemButton from "@mui/material/ListItemButton";


import ListItemText from "@mui/material/ListItemText";





type SideMenuItemProps = {


  label: string;


  active?: boolean;


  onClick?: () => void;


};





export default function SideMenuItem({ label, active, onClick }: SideMenuItemProps) {


  return (


    <ListItemButton selected={active} onClick={onClick}>


      <ListItemText primary={label} />


    </ListItemButton>


  );


}"""


    )


    


    gen.add_template(


        f"{base}/components/navigation/SideMenu.tsx",


        """// SideMenu.tsx


import React from "react";


import List from "@mui/material/List";


import SideMenuItem from "./SideMenuItem";





type SideMenuProps = {


  activeSection?: string;


};





const ITEMS = [


  { id: "coop", label: "Coop Settings" },


  { id: "doors", label: "Doors & Latches" },


  { id: "motors", label: "Motors & Rails" },


  { id: "robot", label: "Robot Arm" },


  { id: "sensors", label: "Sensors" },


  { id: "feed", label: "Feeding & Water" },


  { id: "waste", label: "Waste Cleaning" },


  { id: "eggs", label: "Egg Map" },


  { id: "schedules", label: "Schedules" },


  { id: "custom", label: "Custom Settings" },


  { id: "account", label: "Account" },


];





export default function SideMenu({ activeSection }: SideMenuProps) {


  return (


    <nav>


      <List dense>


        {ITEMS.map((item) => (


          <SideMenuItem


            key={item.id}


            label={item.label}


            active={activeSection === item.id}


          />


        ))}


      </List>


    </nav>


  );


}"""


    )


    


    # Viewport stub


    gen.add_template(


        f"{base}/components/viewport/Viewport3D.tsx",


        """// Viewport3D.tsx


import React from "react";


import Paper from "@mui/material/Paper";


import Typography from "@mui/material/Typography";





export default function Viewport3D() {


  return (


    <Paper elevation={3} sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>


      <Typography variant="body1">3D Coop / Robot Scene</Typography>


    </Paper>


  );


}"""


    )


    


    # Telemetry panel


    gen.add_template(


        f"{base}/components/telemetry/TelemetryPanel.tsx",


        """// TelemetryPanel.tsx


import React from "react";


import Paper from "@mui/material/Paper";


import Typography from "@mui/material/Typography";


import Grid from "@mui/material/Grid";


import TelemetryItem from "./TelemetryItem";





export default function TelemetryPanel() {


  return (


    <Paper elevation={2} sx={{ p: 2 }}>


      <Typography variant="h6" gutterBottom>


        Telemetry


      </Typography>


      <Grid container spacing={1}>


        <Grid item xs={6}><TelemetryItem label="Temp" value="21.3 °C" /></Grid>


        <Grid item xs={6}><TelemetryItem label="Humidity" value="54 %" /></Grid>


        <Grid item xs={6}><TelemetryItem label="Feed Level" value="OK" /></Grid>


        <Grid item xs={6}><TelemetryItem label="Water Level" value="OK" /></Grid>


      </Grid>


    </Paper>


  );


}"""


    )


    


    gen.add_template(


        f"{base}/components/telemetry/TelemetryItem.tsx",


        """// TelemetryItem.tsx


import React from "react";


import Paper from "@mui/material/Paper";


import Typography from "@mui/material/Typography";





type TelemetryItemProps = {


  label: string;


  value: string;


};





export default function TelemetryItem({ label, value }: TelemetryItemProps) {


  return (


    <Paper variant="outlined" sx={{ p: 1 }}>


      <Typography variant="caption" color="text.secondary">


        {label}


      </Typography>


      <Typography variant="body2">


        {value}


      </Typography>


    </Paper>


  );


}"""


    )


    


    # Toolbar, using ActionButton via ToolbarButton


    gen.add_template(


        f"{base}/components/toolbar/ToolbarButton.tsx",


        """// ToolbarButton.tsx


import React from "react";


import ActionButton, { ActionButtonProps } from "../common/ActionButton";





type ToolbarButtonProps = Omit<ActionButtonProps, "kind">;





export default function ToolbarButton(props: ToolbarButtonProps) {


  return <ActionButton kind="secondary" {...props} />;


}"""


    )


    


    gen.add_template(


        f"{base}/components/toolbar/BottomToolbar.tsx",


        """// BottomToolbar.tsx


import React from "react";


import Stack from "@mui/material/Stack";


import ToolbarButton from "./ToolbarButton";





export default function BottomToolbar() {


  return (


    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>


      <ToolbarButton label="Home" />


      <ToolbarButton label="Center" />


      <ToolbarButton label="Jog" />


      <ToolbarButton label="Map" />


      <ToolbarButton label="3D View" />


    </Stack>


  );


}"""


    )


    


    # 3D model templates and Firebase storage client


    add_3d_model_templates(gen, base)


    


    # Key types (Bird, Coop, notifications, treatment)


    gen.add_template(


        f"{base}/types/bird.ts",


        """// bird.ts





export interface Bird {


  id: string;


  name: string;


  breed?: string;


  sex?: "hen" | "rooster" | "unknown";


  hatchDate?: string; // ISO date


  status: "active" | "watch" | "quarantine" | "rehoming" | "deceased";


  rfidTag?: string;


  photoUrl?: string;


  notes?: string;


  createdAt: string; // ISO datetime


}"""


    )


    


    gen.add_template(


        f"{base}/types/treatment.ts",


        """// treatment.ts





export interface BirdTreatment {


  id: string;


  birdId: string;


  timestamp: string; // ISO datetime


  medication?: string;


  dose?: string;


  route?: string;


  notes?: string;


}"""


    )


    


    gen.add_template(


        f"{base}/types/notifications.ts",


        """// notifications.ts





export type NotificationLevel = "info" | "warning" | "critical";





export interface CoopNotification {


  id: string;


  coopId: string;


  type: string; // e.g. 'bird-risk', 'hardware', 'system'


  birdId?: string;


  level: NotificationLevel;


  title: string;


  message: string;


  createdAt: string;


  read: boolean;


}"""


    )


    


    gen.add_template(


        f"{base}/types/coop.ts",


        """// coop.ts





export type CoopPresetSize = "3x3x5" | "4x4x6" | "6x6x8" | "custom";





export interface CoopDimensions {


  width: number; // X axis (feet)


  depth: number; // Z axis (feet)


  height: number; // Y axis (feet)


}





export interface CoopModelConfig {


  id: string;


  name: string;


  size: CoopPresetSize;


  dimensions: CoopDimensions;


  modelUrl?: string; // URL to custom 3D model (GLB/GLTF)


  thumbnailUrl?: string;


  isCustom: boolean;


  uploadedAt?: string;


  scale?: { x: number; y: number; z: number };


  position?: { x: number; y: number; z: number };


  rotation?: { x: number; y: number; z: number };


}





export const COOP_PRESETS: Record<string, CoopModelConfig> = {


  "3x3x5": {


    id: "preset-3x3x5",


    name: "Small Coop (3x3x5)",


    size: "3x3x5",


    dimensions: { width: 3, depth: 3, height: 5 },


    modelUrl: "/models/coops/presets/coop-3x3x5.glb",


    isCustom: false,


  },


  "4x4x6": {


    id: "preset-4x4x6",


    name: "Medium Coop (4x4x6)",


    size: "4x4x6",


    dimensions: { width: 4, depth: 4, height: 6 },


    modelUrl: "/models/coops/presets/coop-4x4x6.glb",


    isCustom: false,


  },


  "6x6x8": {


    id: "preset-6x6x8",


    name: "Large Coop (6x6x8)",


    size: "6x6x8",


    dimensions: { width: 6, depth: 6, height: 8 },


    modelUrl: "/models/coops/presets/coop-6x6x8.glb",


    isCustom: false,


  },


};"""


    )


    


    # Generic stubs for core pages and routes


    for file in [


        "routes/AppRoutes.tsx",


        "pages/DashboardPage.tsx",


        "pages/ChickenEyeDashboardPage.tsx",


        "pages/ChickenEyeBirdPage.tsx",


        "pages/BirdManagementPage.tsx",


        "pages/BirdEditPage.tsx",


        "pages/SchedulesPage.tsx",


        "pages/SettingsPage.tsx",


        "pages/AccountPage.tsx",


        "pages/DiagnosticsPage.tsx",


        "pages/AnalyticsPage.tsx",


        "pages/SetupWizardPage.tsx",


    ]:


        path = f"{base}/{file}"


        name = os.path.basename(file).replace(".tsx", "")


        gen.add_template(path, lambda n=name: TemplateGenerators.react_component(n))








def add_3d_model_templates(gen: ProjectGenerator, base: str) -> None:


    """Add 3D model management templates."""


    


    gen.add_template(f"{base}/models/loaders/ModelLoader.ts", """// ModelLoader.ts


import * as THREE from 'three';


import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';





export class ModelLoader {


  private gltfLoader: GLTFLoader;


  private dracoLoader: DRACOLoader;


  


  constructor() {


    this.dracoLoader = new DRACOLoader();


    this.dracoLoader.setDecoderPath('/draco/');


    


    this.gltfLoader = new GLTFLoader();


    this.gltfLoader.setDRACOLoader(this.dracoLoader);


  }


  


  async loadModel(url: string): Promise<THREE.Group> {


    return new Promise((resolve, reject) => {


      this.gltfLoader.load(


        url,


        (gltf) => resolve(gltf.scene),


        (progress) => {


          const percent = (progress.loaded / progress.total) * 100;


          console.log(`Loading model: ${percent.toFixed(2)}%`);


        },


        (error) => reject(error)


      );


    });


  }


  


  dispose(): void {


    this.dracoLoader.dispose();


  }


}""")


    


    gen.add_template(f"{base}/models/presets/coopPresets.ts", """// coopPresets.ts


import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';





export function getPresetModel(size: string): CoopModelConfig | null {


  return COOP_PRESETS[size] || null;


}





export function getAllPresets(): CoopModelConfig[] {


  return Object.values(COOP_PRESETS);


}





export function getDefaultPreset(): CoopModelConfig {


  return COOP_PRESETS["4x4x6"];


}""")


    


    gen.add_template(f"{base}/components/viewport/CoopModelSelector.tsx", """// CoopModelSelector.tsx


import React, { useState } from 'react';


import {


  Box,


  Button,


  Card,


  CardContent,


  CardMedia,


  Grid,


  Typography,


  Dialog,


  DialogTitle,


  DialogContent,


  DialogActions,


} from '@mui/material';


import { Upload as UploadIcon } from '@mui/icons-material';


import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';





type CoopModelSelectorProps = {


  currentModel?: CoopModelConfig;


  onSelectModel: (model: CoopModelConfig) => void;


  onUploadCustom: (file: File) => void;


};





export default function CoopModelSelector({


  currentModel,


  onSelectModel,


  onUploadCustom,


}: CoopModelSelectorProps) {


  const [open, setOpen] = useState(false);


  const [uploading, setUploading] = useState(false);





  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {


    const file = e.target.files?.[0];


    if (!file) return;


    


    if (!file.name.match(/\\.(glb|gltf)$/i)) {


      alert('Please select a GLB or GLTF file');


      return;


    }


    


    if (file.size > 50 * 1024 * 1024) {


      alert('File size must be less than 50MB');


      return;


    }


    


    setUploading(true);


    try {


      await onUploadCustom(file);


      setOpen(false);


    } catch (error) {


      console.error('Upload failed:', error);


      alert('Failed to upload model');


    } finally {


      setUploading(false);


    }


  };





  return (


    <>


      <Button variant="outlined" onClick={() => setOpen(true)}>


        Change Coop Model


      </Button>





      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>


        <DialogTitle>Select Coop Model</DialogTitle>


        <DialogContent>


          <Typography variant="subtitle2" gutterBottom>


            Preset Models


          </Typography>


          <Grid container spacing={2} sx={{ mb: 3 }}>


            {Object.values(COOP_PRESETS).map((preset) => (


              <Grid item xs={12} sm={4} key={preset.id}>


                <Card


                  sx={{


                    cursor: 'pointer',


                    border: currentModel?.id === preset.id ? 2 : 0,


                    borderColor: 'primary.main',


                  }}


                  onClick={() => {


                    onSelectModel(preset);


                    setOpen(false);


                  }}


                >


                  <CardMedia


                    component="div"


                    sx={{


                      height: 120,


                      bgcolor: 'grey.800',


                      display: 'flex',


                      alignItems: 'center',


                      justifyContent: 'center',


                    }}


                  >


                    <Typography variant="h6" color="text.secondary">


                      {preset.dimensions.width}×{preset.dimensions.depth}×


                      {preset.dimensions.height}


                    </Typography>


                  </CardMedia>


                  <CardContent>


                    <Typography variant="body2">{preset.name}</Typography>


                  </CardContent>


                </Card>


              </Grid>


            ))}


          </Grid>





          <Typography variant="subtitle2" gutterBottom>


            Custom Model


          </Typography>


          <Box


            sx={{


              border: '2px dashed',


              borderColor: 'grey.600',


              borderRadius: 1,


              p: 3,


              textAlign: 'center',


            }}


          >


            <input


              type="file"


              accept=".glb,.gltf"\n\n              style={{ display: 'none' }}\n\n              id="model-upload"


              onChange={handleFileSelect}


            />


            <label htmlFor="model-upload">


              <Button


                variant="contained"


                component="span"


                startIcon={<UploadIcon />}


                disabled={uploading}


              >


                {uploading ? 'Uploading...' : 'Upload Custom Model'}


              </Button>


            </label>


            <Typography variant="caption" display="block" sx={{ mt: 1 }}>


              GLB or GLTF format, max 50MB


            </Typography>


          </Box>


        </DialogContent>


        <DialogActions>


          <Button onClick={() => setOpen(false)}>Cancel</Button>


        </DialogActions>


      </Dialog>


    </>


  );


}""")


    


    gen.add_template(f"{base}/lib/firebase/modelStorageClient.ts", """// modelStorageClient.ts


import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';


import { storage } from './firebaseApp';


import { CoopModelConfig } from '@/types/coop';





export async function uploadCoopModel(


  file: File,


  userId: string,


  coopId: string


): Promise<string> {


  const timestamp = Date.now();


  const fileName = `${timestamp}-${file.name}`;


  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);


  


  await uploadBytes(storageRef, file, {


    contentType: file.type || 'application/octet-stream',


    customMetadata: {


      originalName: file.name,


      uploadedAt: new Date().toISOString(),


    },


  });


  


  const downloadURL = await getDownloadURL(storageRef);


  return downloadURL;


}





export async function deleteCoopModel(


  userId: string,


  coopId: string,


  fileName: string


): Promise<void> {


  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);


  await deleteObject(storageRef);


}





export function createCustomModelConfig(


  modelUrl: string,


  fileName: string,


  dimensions: { width: number; depth: number; height: number }


): CoopModelConfig {


  return {


    id: `custom-${Date.now()}`,


    name: `Custom Model (${fileName})`,


    size: 'custom',


    dimensions,


    modelUrl,


    isCustom: true,


    uploadedAt: new Date().toISOString(),


  };


}""")








# ============================================================


# ROOT FILES


# ============================================================





def add_root_files(gen: ProjectGenerator, animal: str) -> None:


    """Add root configuration and docs."""


    


    gen.add_templates({


        ".env.example": """# Frontend


VITE_API_BASE_URL=http://localhost:5173/api


VITE_SIM_MODE=true





# Backend


API_PORT=4000





# 3D Model Storage


VITE_MODEL_STORAGE_URL=http://localhost:5173/models


MAX_MODEL_FILE_SIZE=50MB""",


        


        "firebase.json": """{


  "hosting": {


    "public": "dist",


    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],


    "rewrites": [{"source": "**", "destination": "/index.html"}]


  },


  "storage": {


    "rules": "storage.rules"


  }


}""",


        


        "storage.rules": """rules_version = '2';


service firebase.storage {


  match /b/{bucket}/o {


    match /users/{userId}/coops/{coopId}/models/{modelFile} {


      allow read: if request.auth != null;


      allow write: if request.auth != null 


        && request.auth.uid == userId


        && request.resource.size < 50 * 1024 * 1024 // 50MB limit


        && request.resource.contentType.matches('model/gltf-binary|model/gltf\\+json|application/octet-stream');


    }


  }


}""",


        


        "docs/architecture.md": """# TenderCells Unified UI Architecture





Full-stack application with React frontend and Express backend for multiple products.""",


        


        "docs/3d-models.md": """# 3D Model Integration Guide





This document describes how coop models are stored, validated, and loaded in the TenderCells app.""",


        


        "docs/connectivity.md": """# Connectivity Services Guide





Overview of BLE, WiFi, MQTT, and WebSocket integration for TenderCells hardware devices.""",


    })








# ============================================================


# PWA, ANALYTICS, ERROR TRACKING


# ============================================================





def add_pwa_analytics_error_tracking(gen: ProjectGenerator) -> None:


    """Add PWA, analytics, and error tracking templates."""


    


    gen.add_template("public/manifest.json", """{


  "name": "TenderCells",


  "short_name": "TenderCells",


  "start_url": "/",


  "display": "standalone",


  "background_color": "#6750A4",


  "theme_color": "#6750A4",


  "icons": [


    {


      "src": "assets/logo.png",


      "sizes": "192x192",


      "type": "image/png"


    }


  ]


}""")


    


    gen.add_template("src/service-worker.ts", """// service-worker.ts


self.addEventListener('install', (event) => {


  event.waitUntil(


    caches.open('tendercells-cache').then((cache) => {


      return cache.addAll([


        '/',


        '/index.html',


        '/assets/logo.png',


        '/assets/main.css',


        '/assets/main.js'


      ]);


    })


  );


});





self.addEventListener('fetch', (event) => {


  event.respondWith(


    caches.match(event.request).then((response) => {


      return response || fetch(event.request);


    })


  );


});""")


    


    gen.add_template("src/analytics.ts", """// analytics.ts


import { initializeApp } from 'firebase/app';


import { getAnalytics } from 'firebase/analytics';





const firebaseConfig = {


  // Your Firebase config here


};





const app = initializeApp(firebaseConfig);


export const analytics = getAnalytics(app);""")


    


    gen.add_template("src/error-tracking.ts", """// error-tracking.ts


import * as Sentry from '@sentry/react';


import { Integrations } from '@sentry/tracing';





Sentry.init({


  dsn: 'your-sentry-dsn',


  integrations: [new Integrations.BrowserTracing()],


  tracesSampleRate: 1.0,


});""")








# ============================================================


# E2E TESTING TEMPLATES


# ============================================================





def add_e2e_testing_templates(gen: ProjectGenerator) -> None:


    """Add e2e testing templates for connectivity pages, components, functions, and services."""


    


    gen.add_template("cypress/e2e/connectivity.cy.ts", """// connectivity.cy.ts


describe('Connectivity Page', () => {


  beforeEach(() => {


    cy.visit('/connectivity');


  });





  it('should display connectivity settings', () => {


    cy.get('[data-testid="connectivity-settings"]').should('be.visible');


  });





  it('should allow device pairing', () => {


    cy.get('[data-testid="pair-device-button"]').click();


    cy.get('[data-testid="pairing-success"]').should('be.visible');


  });


});""")


    


    gen.add_template("cypress/e2e/settings.cy.ts", """// settings.cy.ts


describe('Settings Page', () => {


  beforeEach(() => {


    cy.visit('/settings');


  });





  it('should display settings page', () => {


    cy.get('[data-testid="settings-page"]').should('be.visible');


  });





  it('should allow saving settings', () => {


    cy.get('[data-testid="save-settings-button"]').click();


    cy.get('[data-testid="settings-saved"]').should('be.visible');


  });


});""")


    


    gen.add_template("cypress/e2e/account.cy.ts", """// account.cy.ts


describe('Account Page', () => {


  beforeEach(() => {


    cy.visit('/account');


  });





  it('should display account page', () => {


    cy.get('[data-testid="account-page"]').should('be.visible');


  });





  it('should allow updating account', () => {


    cy.get('[data-testid="update-account-button"]').click();


    cy.get('[data-testid="account-updated"]').should('be.visible');


  });


});""")


    


    gen.add_template("cypress/support/index.ts", """// index.ts


import './commands';


""")


    


    gen.add_template("cypress/support/commands.ts", """// commands.ts


Cypress.Commands.add('login', (email, password) => {


  cy.get('[data-testid="email-input"]').type(email);


  cy.get('[data-testid="password-input"]').type(password);


  cy.get('[data-testid="login-button"]').click();


});


""")


    


    gen.add_template("cypress.config.ts", """// cypress.config.ts


import { defineConfig } from 'cypress';





export default defineConfig({


  e2e: {


    baseUrl: 'http://localhost:3000',


    supportFile: 'cypress/support/index.ts',


    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',


  },


});


""")








# ============================================================


# PROJECT BUILDERS REGISTRY


# ============================================================





PROJECT_BUILDERS: Dict[str, Callable[[], ProjectGenerator]] = {


    "tendercells-ui": build_tendercells_ui_project,


}








# ============================================================


# MAIN EXECUTION


# ============================================================





if __name__ == "__main__":


    parser = argparse.ArgumentParser(


        description="TenderCells unified UI scaffolding generator"


    )


    parser.add_argument(


        "--project",


        "-p",


        choices=list(PROJECT_BUILDERS.keys()),


        default="tendercells-ui",


        help="Which project scaffold to generate",


    )


    parser.add_argument(


        "--quiet",


        "-q",


        action="store_true",


        help="Suppress detailed output",


    )





    args = parser.parse_args()





    builder = PROJECT_BUILDERS.get(args.project)


    if not builder:


        print("Unknown project. Available options:")


        for key in PROJECT_BUILDERS.keys():


            print(f" - {key}")


        sys.exit(1)





    generator = builder()


    generator.generate(verbose=not args.quiet)