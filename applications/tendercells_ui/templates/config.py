"""Configuration file template generators."""


class ConfigTemplates:
    """Factory for configuration file templates."""
    
    @staticmethod
    def package_json(name: str, version: str = "0.0.0", dependencies: dict = None, dev_dependencies: dict = None) -> str:
        """Generate a package.json template."""
        deps = dependencies or {}
        dev_deps = dev_dependencies or {}
        
        deps_str = ",\n".join(f'    "{k}": "{v}"' for k, v in deps.items())
        dev_deps_str = ",\n".join(f'    "{k}": "{v}"' for k, v in dev_deps.items())
        
        return f"""{{
  "name": "{name}",
  "private": true,
  "version": "{version}",
  "type": "module",
  "scripts": {{
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }},
  "dependencies": {{
{deps_str}
  }},
  "devDependencies": {{
{dev_deps_str}
  }}
}}"""
    
    @staticmethod
    def vite_config_ts() -> str:
        """Generate a vite.config.ts template."""
        return """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})"""
    
    @staticmethod
    def tsconfig_json() -> str:
        """Generate a tsconfig.json template."""
        return """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}"""

