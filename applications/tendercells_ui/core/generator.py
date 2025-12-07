"""
Core framework for project scaffolding.
Contains FileTemplate and ProjectGenerator classes.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, List, Dict, Optional


@dataclass
class FileTemplate:
    """Represents a file template with content generation."""
    path: str
    content: str | Callable[[], str]
    skip_if_exists: bool = True

    def get_content(self) -> str:
        """Get the file content, calling the generator if needed."""
        if callable(self.content):
            return self.content()
        return self.content


class ProjectGenerator:
    """Main generator class for creating project structures."""
    
    def __init__(self, project_name: str = "project", base_path: str = ""):
        self.project_name = project_name
        self.base_path = base_path
        self.directories: List[str] = []
        self.templates: List[FileTemplate] = []
        
    def add_directories(self, dirs: List[str]) -> 'ProjectGenerator':
        """Add directories to create."""
        self.directories.extend(dirs)
        return self
    
    def add_template(self, path: str, content: str | Callable, 
                     skip_if_exists: bool = True) -> 'ProjectGenerator':
        """Add a file template."""
        self.templates.append(FileTemplate(path, content, skip_if_exists))
        return self
    
    def add_templates(self, templates: Dict[str, str | Callable], 
                      base_path: str = "") -> 'ProjectGenerator':
        """Add multiple templates from a dictionary."""
        for path, content in templates.items():
            full_path = os.path.join(base_path, path) if base_path else path
            self.add_template(full_path, content)
        return self
    
    def generate(self, verbose: bool = True) -> None:
        """Execute the generation process."""
        if verbose:
            try:
                print(f"\n🚀 Generating {self.project_name} scaffolding...\n")
            except UnicodeEncodeError:
                print(f"\n[*] Generating {self.project_name} scaffolding...\n")
        
        self._create_directories(verbose)
        self._create_files(verbose)
        
        if verbose:
            try:
                print(f"\n✅ {self.project_name} scaffolding complete!\n")
            except UnicodeEncodeError:
                print(f"\n[+] {self.project_name} scaffolding complete!\n")
    
    def _create_directories(self, verbose: bool) -> None:
        """Create all directories."""
        for directory in self.directories:
            full_path = os.path.join(self.base_path, directory) if self.base_path else directory
            Path(full_path).mkdir(parents=True, exist_ok=True)
            if verbose:
                try:
                    print(f"📁 Created: {full_path}")
                except UnicodeEncodeError:
                    print(f"[DIR] Created: {full_path}")
    
    def _create_files(self, verbose: bool) -> None:
        """Create all template files."""
        for template in self.templates:
            full_path = os.path.join(self.base_path, template.path) if self.base_path else template.path
            if template.skip_if_exists and os.path.exists(full_path):
                if verbose:
                    try:
                        print(f"⏩ Skipping: {full_path}")
                    except UnicodeEncodeError:
                        print(f"[SKIP] Skipping: {full_path}")
                continue
            
            # Ensure parent directory exists
            parent = os.path.dirname(full_path)
            if parent:
                Path(parent).mkdir(parents=True, exist_ok=True)
            
            # Write file
            content = template.get_content()
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content.strip() + "\n")
            
            if verbose:
                try:
                    print(f"📄 Created: {full_path}")
                except UnicodeEncodeError:
                    print(f"[FILE] Created: {full_path}")

