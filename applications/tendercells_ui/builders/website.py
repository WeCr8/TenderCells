"""
Marketing website builder.
"""

from ..core.generator import ProjectGenerator
from ..structures.react_app import ReactAppStructures
from ..templates.react import ReactTemplates
from ..templates.config import ConfigTemplates


def build_website(base_path: str = "") -> ProjectGenerator:
    """Build a marketing website.
    
    Args:
        base_path: Base path for generated files
        
    Returns:
        Configured ProjectGenerator instance
    """
    gen = ProjectGenerator("TenderCells Website", base_path=base_path)
    
    # Frontend structure (simpler than full app)
    frontend_base = "src"
    gen.add_directories(ReactAppStructures.base_react_app(frontend_base))
    
    # Add marketing website templates
    add_website_templates(gen, frontend_base)
    
    # Add root configuration files
    add_website_root_files(gen)
    
    return gen


def add_website_templates(gen: ProjectGenerator, base: str) -> None:
    """Add marketing website templates."""
    
    # Main entry point
    gen.add_template(f"{base}/main.tsx", """// main.tsx
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
    gen.add_template(f"{base}/App.tsx", """// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;""")
    
    # Landing page
    gen.add_template(f"{base}/pages/LandingPage.tsx", ReactTemplates.react_component("LandingPage"))
    
    # NotFound page
    gen.add_template(f"{base}/pages/NotFoundPage.tsx", ReactTemplates.react_component("NotFoundPage"))
    
    # Header component
    gen.add_template(f"{base}/components/Header.tsx", ReactTemplates.react_component("Header"))
    
    # Footer component
    gen.add_template(f"{base}/components/Footer.tsx", ReactTemplates.react_component("Footer"))
    
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
}""")


def add_website_root_files(gen: ProjectGenerator) -> None:
    """Add root configuration files for website."""
    
    # package.json
    gen.add_template("package.json", ConfigTemplates.package_json(
        name="tender-cells-website",
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
    gen.add_template("index.html", """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells - Smart Farming Solutions</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""")

