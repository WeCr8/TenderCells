"""
Central registry for all project builders.
"""

from typing import Dict, Callable
from ..core.generator import ProjectGenerator
from .unified_ui import build_tendercells_ui_project
from .react_web_app import build_react_web_app
from .express_api import build_express_api
from .website import build_website


# Registry mapping project names to builder functions
PROJECT_BUILDERS: Dict[str, Callable[..., ProjectGenerator]] = {
    "tendercells-ui": build_tendercells_ui_project,
    "react-web-app": build_react_web_app,
    "express-api": build_express_api,
    "website": build_website,
}

# Supported products for react-web-app
SUPPORTED_PRODUCTS = [
    "chicken-tender",
    "duck-dock",
    "goat-guardian",
    "pig-pal",
    "cattle-care",
]


def get_builder(project: str):
    """Get a builder function by project name.
    
    Args:
        project: Project name
        
    Returns:
        Builder function or None if not found
    """
    return PROJECT_BUILDERS.get(project)


def list_projects() -> list[str]:
    """List all available project types.
    
    Returns:
        List of project type names
    """
    return list(PROJECT_BUILDERS.keys())


def is_product_supported(product: str) -> bool:
    """Check if a product is supported for react-web-app.
    
    Args:
        product: Product name
        
    Returns:
        True if product is supported
    """
    return product in SUPPORTED_PRODUCTS

