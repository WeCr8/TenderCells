"""TypeScript interface template generators."""

from typing import Dict


class TypeScriptTemplates:
    """Factory for TypeScript interface templates."""
    
    @staticmethod
    def typescript_interface(name: str, fields: Dict[str, str]) -> str:
        """Generate a TypeScript interface."""
        field_lines = "\n".join(f"  {k}: {v};" for k, v in fields.items())
        return f"""// {name}.ts

export interface {name} {{
{field_lines}
}}"""

