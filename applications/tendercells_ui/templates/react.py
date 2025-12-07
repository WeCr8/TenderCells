"""React component template generators."""

from typing import Optional


class ReactTemplates:
    """Factory for React component templates."""
    
    @staticmethod
    def react_component(name: str, props: Optional[str] = None) -> str:
        """Generate a React component template."""
        props_type = f"type {name}Props = {props};\n\n" if props else ""
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

