"""Base builder class for project builders."""

from typing import Protocol
from ..core.generator import ProjectGenerator


class ProjectBuilder(Protocol):
    """Protocol for project builders."""
    
    def __call__(self, base_path: str = "", **kwargs) -> ProjectGenerator:
        """Build a project generator.
        
        Args:
            base_path: Base path for generated files
            **kwargs: Additional builder-specific arguments
            
        Returns:
            Configured ProjectGenerator instance
        """
        ...

