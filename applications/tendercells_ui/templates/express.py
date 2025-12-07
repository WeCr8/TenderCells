"""Express API template generators."""

from typing import List, Tuple


class ExpressTemplates:
    """Factory for Express API templates."""
    
    @staticmethod
    def express_router(name: str, routes: List[Tuple[str, str, str]]) -> str:
        """Generate an Express router template.
        
        Args:
            name: Router name
            routes: List of tuples (method, path, handler)
        """
        route_lines = "\n".join(
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

