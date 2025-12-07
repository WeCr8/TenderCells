"""
React web app builder for product-specific applications.
Supports chicken-tender, duck-dock, goat-guardian, pig-pal, cattle-care.
"""

from ..core.generator import ProjectGenerator
from ..structures.react_app import ReactAppStructures
from ..templates.react import ReactTemplates
from ..templates.config import ConfigTemplates


def build_react_web_app(product: str = "chicken-tender", base_path: str = "") -> ProjectGenerator:
    """Build a React web app for a specific product.
    
    Args:
        product: Product name (chicken-tender, duck-dock, goat-guardian, pig-pal, cattle-care)
        base_path: Base path for generated files
        
    Returns:
        Configured ProjectGenerator instance
    """
    product_names = {
        "chicken-tender": "Chicken Tender",
        "duck-dock": "Duck Dock",
        "goat-guardian": "Goat Guardian",
        "pig-pal": "Pig Pal",
        "cattle-care": "Cattle Care",
    }
    
    project_name = product_names.get(product, product.title().replace("-", " "))
    gen = ProjectGenerator(f"{project_name} Web App", base_path=base_path)
    
    # Frontend structure with product-specific directories
    frontend_base = "src"
    gen.add_directories(ReactAppStructures.product_specific(product, frontend_base))
    
    # Add base React app templates
    add_base_react_templates(gen, frontend_base, product, project_name)
    
    # Add product-specific templates
    add_product_specific_templates(gen, frontend_base, product)
    
    # Add root configuration files
    add_react_root_files(gen, product)
    
    return gen


def add_base_react_templates(gen: ProjectGenerator, base: str, product: str, project_name: str) -> None:
    """Add base React app templates."""
    
    # Main entry point
    gen.add_template(f"{base}/main.tsx", f"""// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);""")
    
    # App component
    gen.add_template(f"{base}/App.tsx", f"""// App.tsx
import React from "react";
import {{ BrowserRouter, Routes, Route }} from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {{
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={{<DashboardPage />}} />
        <Route path="*" element={{<NotFoundPage />}} />
      </Routes>
    </BrowserRouter>
  );
}}

export default App;""")
    
    # Basic CSS
    gen.add_template(f"{base}/index.css", """/* index.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}""")
    
    # Dashboard page
    gen.add_template(f"{base}/pages/DashboardPage.tsx", f"""// DashboardPage.tsx
import React from "react";

export default function DashboardPage() {{
  return (
    <div>
      <h1>{project_name} Dashboard</h1>
      <p>Welcome to {project_name}</p>
    </div>
  );
}}""")
    
    # NotFound page
    gen.add_template(f"{base}/pages/NotFoundPage.tsx", """// NotFoundPage.tsx
import React from "react";

export default function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
    </div>
  );
}""")
    
    # Basic router
    gen.add_template(f"{base}/router/AppRouter.tsx", """// AppRouter.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}""")


def add_product_specific_templates(gen: ProjectGenerator, base: str, product: str) -> None:
    """Add product-specific templates based on product type."""
    
    product_templates = {
        "chicken-tender": [
            (f"{base}/components/flock/FlockList.tsx", ReactTemplates.react_component("FlockList")),
            (f"{base}/components/chicken-eye/ChickenEyeView.tsx", ReactTemplates.react_component("ChickenEyeView")),
        ],
        "duck-dock": [
            (f"{base}/components/pond-monitoring/PondMonitor.tsx", ReactTemplates.react_component("PondMonitor")),
            (f"{base}/components/water-quality/WaterQualityPanel.tsx", ReactTemplates.react_component("WaterQualityPanel")),
        ],
        "goat-guardian": [
            (f"{base}/components/pasture-management/PastureMap.tsx", ReactTemplates.react_component("PastureMap")),
            (f"{base}/components/milk-tracking/MilkTracker.tsx", ReactTemplates.react_component("MilkTracker")),
        ],
        "pig-pal": [
            (f"{base}/components/pen-management/PenManager.tsx", ReactTemplates.react_component("PenManager")),
            (f"{base}/components/weight-tracking/WeightTracker.tsx", ReactTemplates.react_component("WeightTracker")),
        ],
        "cattle-care": [
            (f"{base}/components/herd-management/HerdList.tsx", ReactTemplates.react_component("HerdList")),
            (f"{base}/components/grazing/GrazingPlanner.tsx", ReactTemplates.react_component("GrazingPlanner")),
        ],
    }
    
    templates = product_templates.get(product, [])
    for path, content in templates:
        gen.add_template(path, content)


def add_react_root_files(gen: ProjectGenerator, product: str) -> None:
    """Add root configuration files for React app."""
    
    package_name = product.replace("-", "-")
    
    # package.json
    gen.add_template("package.json", ConfigTemplates.package_json(
        name=package_name,
        dependencies={
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "react-router-dom": "^6.28.0",
        },
        dev_dependencies={
            "@types/react": "^18.3.12",
            "@types/react-dom": "^18.3.1",
            "@vitejs/plugin-react": "^4.3.3",
            "typescript": "~5.6.2",
            "vite": "^5.4.10",
        }
    ))
    
    # vite.config.ts
    gen.add_template("vite.config.ts", ConfigTemplates.vite_config_ts())
    
    # tsconfig.json
    gen.add_template("tsconfig.json", ConfigTemplates.tsconfig_json())
    
    # index.html
    gen.add_template("index.html", f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{product.title().replace("-", " ")}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""")

