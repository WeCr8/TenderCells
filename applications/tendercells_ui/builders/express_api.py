"""
Express API builder for backend services.
"""

from ..core.generator import ProjectGenerator
from ..structures.express_api import ExpressApiStructures
from ..templates.express import ExpressTemplates


def build_express_api(base_path: str = "") -> ProjectGenerator:
    """Build an Express API backend.
    
    Args:
        base_path: Base path for generated files
        
    Returns:
        Configured ProjectGenerator instance
    """
    gen = ProjectGenerator("Express API", base_path=base_path)
    
    # Backend structure
    backend_base = "backend/src"
    gen.add_directories(ExpressApiStructures.express_api(backend_base))
    
    # Add Express API templates
    add_express_templates(gen, backend_base)
    
    # Add root configuration files
    add_express_root_files(gen)
    
    return gen


def add_express_templates(gen: ProjectGenerator, base: str) -> None:
    """Add Express API templates."""
    
    # Main server file
    gen.add_template(f"{base}/server.ts", """// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});""")
    
    # Example router
    gen.add_template(
        f"{base}/routes/index.ts",
        ExpressTemplates.express_router("index", [
            ("get", "/", "index"),
        ])
    )
    
    # Example controller
    gen.add_template(f"{base}/controllers/index.controller.ts", """// index.controller.ts
import { Request, Response } from 'express';

export async function index(req: Request, res: Response) {
  res.json({ message: 'TenderCells API' });
}""")
    
    # Example service
    gen.add_template(
        f"{base}/services/example.service.ts",
        ExpressTemplates.express_service("example", "Example")
    )


def add_express_root_files(gen: ProjectGenerator) -> None:
    """Add root configuration files for Express API."""
    
    # package.json
    gen.add_template("package.json", """{
  "name": "tendercells-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "ts-node --esm backend/src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}""")
    
    # tsconfig.json
    gen.add_template("tsconfig.json", """{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["backend/src/**/*"],
  "exclude": ["node_modules", "dist"]
}""")
    
    # .env.example
    gen.add_template(".env.example", """PORT=4000
NODE_ENV=development
DATABASE_URL=
""")

