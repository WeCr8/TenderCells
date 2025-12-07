"""
TenderCells Unified UI Scaffolding Generator

A modular Python package for generating project scaffolding for various
TenderCells applications including React web apps, Express APIs, unified UI,
and mobile apps.
"""

from .core.generator import FileTemplate, ProjectGenerator
from .builders import (
    build_tendercells_ui_project,
    build_react_web_app,
    build_express_api,
    build_website,
)
from .builders.registry import (
    PROJECT_BUILDERS,
    list_projects,
    SUPPORTED_PRODUCTS,
    is_product_supported,
)

__version__ = "1.0.0"

__all__ = [
    # Core
    "FileTemplate",
    "ProjectGenerator",
    # Builders
    "build_tendercells_ui_project",
    "build_react_web_app",
    "build_express_api",
    "build_website",
    # Registry
    "PROJECT_BUILDERS",
    "list_projects",
    "SUPPORTED_PRODUCTS",
    "is_product_supported",
]

