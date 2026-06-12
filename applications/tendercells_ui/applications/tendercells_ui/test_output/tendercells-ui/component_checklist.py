#!/usr/bin/env python3
"""
Component Checklist Generator and Manager
==========================================

Scans the codebase for React/TypeScript components and generates a checklist system
to track component status (implemented, tested, documented, etc.).

Usage:
    python component_checklist.py scan          # Scan and generate checklist
    python component_checklist.py update        # Update existing checklist
    python component_checklist.py report        # Generate status report
    python component_checklist.py interactive   # Interactive checklist manager
"""

import os
import re
import json
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict, field
from enum import Enum

class ComponentStatus(Enum):
    """Status enum for component checklist items"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    TESTED = "tested"
    DOCUMENTED = "documented"
    COMPLETE = "complete"

@dataclass
class ComponentInfo:
    """Information about a component"""
    name: str
    file_path: str
    type: str  # 'component', 'page', 'hook', 'service', 'utility'
    line_count: int = 0
    has_exports: bool = False
    has_tests: bool = False
    has_stories: bool = False
    imports: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)
    status: str = ComponentStatus.NOT_STARTED.value
    notes: str = ""
    last_updated: str = ""
    dependencies: List[str] = field(default_factory=list)

@dataclass
class ChecklistData:
    """Checklist data structure"""
    generated_at: str
    project_path: str
    components: List[Dict[str, Any]]
    statistics: Dict[str, int] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

class ComponentScanner:
    """Scans the codebase for components and generates checklist data"""
    
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.src_path = self.base_path / "src"
        self.components: List[ComponentInfo] = []
        
        # Component patterns
        self.component_patterns = {
            'component': re.compile(r'(?:export\s+)?(?:default\s+)?(?:function|const)\s+(\w+Component|\w+)\s*[:\(]'),
            'class_component': re.compile(r'export\s+default\s+class\s+(\w+)\s+extends'),
            'page': re.compile(r'export\s+default\s+function\s+(\w+Page)'),
            'hook': re.compile(r'export\s+(?:function\s+)?use(\w+)\s*\([^)]*\)\s*[:{\(]'),
            'service': re.compile(r'export\s+class\s+(\w+Service)'),
        }
        
        # File type mappings
        self.file_type_map = {
            'components': 'component',
            'pages': 'page',
            'hooks': 'hook',
            'services': 'service',
            'utils': 'utility',
        }
    
    def scan(self) -> List[ComponentInfo]:
        """Scan the codebase and return component information"""
        self.components = []
        
        print(f"Scanning components in: {self.base_path}")
        print(f"Source path: {self.src_path}")
        
        if not self.src_path.exists():
            print(f"Error: Source path not found: {self.src_path}")
            return []
        
        print(f"Source directory exists: {self.src_path.exists()}")
        print("\nScanning directories...")
        
        # Scan different file types
        self._scan_directory(self.src_path / "components", "component")
        self._scan_directory(self.src_path / "pages", "page")
        self._scan_directory(self.src_path / "hooks", "hook")
        self._scan_directory(self.src_path / "services", "service")
        self._scan_directory(self.src_path / "utils", "utility")
        
        # Scan root level files in src
        print("\nScanning root src files...")
        self._scan_directory(self.src_path, None)
        
        print(f"\n✓ Scan complete! Found {len(self.components)} components")
        return self.components
    
    def _scan_directory(self, directory: Path, default_type: Optional[str]):
        """Scan a directory for component files"""
        if not directory.exists():
            return
        
        # Use glob patterns that work with rglob
        patterns = ["*.tsx", "*.ts", "*.jsx", "*.js"]
        file_count = 0
        for pattern in patterns:
            for file_path in directory.rglob(pattern):
                if any(skip in str(file_path) for skip in ['node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'coverage']):
                    continue
                
                component_type = default_type or self._detect_type_from_path(file_path)
                self._analyze_file(file_path, component_type)
                file_count += 1
        
        if file_count > 0:
            print(f"  Scanned {directory.name}: {file_count} files")
    
    def _detect_type_from_path(self, file_path: Path) -> str:
        """Detect component type from file path"""
        path_str = str(file_path)
        for folder, comp_type in self.file_type_map.items():
            if folder in path_str:
                return comp_type
        return "unknown"
    
    def _analyze_file(self, file_path: Path, component_type: str):
        """Analyze a single file for components"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Get line count
            line_count = len(content.splitlines())
            
            # Find components based on patterns
            found_components = []
            
            for pattern_type, pattern in self.component_patterns.items():
                matches = pattern.finditer(content)
                for match in matches:
                    name = match.group(1)
                    found_components.append({
                        'name': name,
                        'type': component_type if component_type != 'unknown' else pattern_type,
                        'pattern_type': pattern_type,
                    })
            
            # If no patterns matched but it's a component file, try to extract from filename
            if not found_components and component_type in ['component', 'page']:
                name = file_path.stem
                if name[0].isupper():  # React components typically start with uppercase
                    found_components.append({
                        'name': name,
                        'type': component_type,
                        'pattern_type': 'file_based',
                    })
            
            # Extract imports and exports
            imports = self._extract_imports(content)
            exports = self._extract_exports(content)
            
            # Check for tests
            test_file = self._find_test_file(file_path)
            has_tests = test_file.exists() if test_file else False
            
            # Check for storybook files
            story_file = self._find_story_file(file_path)
            has_stories = story_file.exists() if story_file else False
            
            # Create component info for each found component
            for comp in found_components:
                component_info = ComponentInfo(
                    name=comp['name'],
                    file_path=str(file_path.relative_to(self.base_path)),
                    type=comp['type'],
                    line_count=line_count,
                    has_exports=len(exports) > 0,
                    has_tests=has_tests,
                    has_stories=has_stories,
                    imports=imports,
                    exports=exports,
                    status=ComponentStatus.NOT_STARTED.value,
                    last_updated=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                )
                self.components.append(component_info)
                
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
    
    def _extract_imports(self, content: str) -> List[str]:
        """Extract import statements from file"""
        import_pattern = re.compile(r'import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+[\'"]([^\'"]+)[\'"]')
        imports = import_pattern.findall(content)
        return list(set(imports))  # Remove duplicates
    
    def _extract_exports(self, content: str) -> List[str]:
        """Extract export statements from file"""
        exports = []
        # Named exports
        named_export = re.compile(r'export\s+(?:const|function|class|interface|type)\s+(\w+)')
        exports.extend(named_export.findall(content))
        # Default export
        if 'export default' in content:
            exports.append('default')
        return list(set(exports))
    
    def _find_test_file(self, file_path: Path) -> Path:
        """Find associated test file"""
        test_patterns = [
            file_path.parent / "__tests__" / f"{file_path.stem}.test.{file_path.suffix}",
            file_path.parent / f"{file_path.stem}.test.{file_path.suffix}",
            file_path.parent.parent / "__tests__" / f"{file_path.stem}.test.{file_path.suffix}",
        ]
        for pattern in test_patterns:
            if pattern.exists():
                return pattern
        return Path("__none__")
    
    def _find_story_file(self, file_path: Path) -> Path:
        """Find associated storybook file"""
        story_path = file_path.parent / f"{file_path.stem}.stories.{file_path.suffix}"
        return story_path

class ChecklistManager:
    """Manages the checklist data"""
    
    def __init__(self, checklist_file: str = "component_checklist.json"):
        self.checklist_file = Path(checklist_file)
        self.data: Optional[ChecklistData] = None
    
    def load(self) -> ChecklistData:
        """Load checklist from file"""
        if self.checklist_file.exists():
            with open(self.checklist_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return ChecklistData(**data)
        return ChecklistData(
            generated_at=datetime.now().isoformat(),
            project_path="",
            components=[],
        )
    
    def save(self, data: ChecklistData):
        """Save checklist to file"""
        with open(self.checklist_file, 'w', encoding='utf-8') as f:
            json.dump(asdict(data), f, indent=2)
        print(f"✓ Checklist saved to: {self.checklist_file}", flush=True)
    
    def update_from_scan(self, scanned_components: List[ComponentInfo], base_path: str):
        """Update checklist with scanned components, preserving existing status"""
        existing = self.load()
        
        # Create a map of existing components by file path
        existing_map = {
            comp['file_path']: comp
            for comp in existing.components
        }
        
        # Merge scanned components with existing data
        updated_components = []
        for comp in scanned_components:
            comp_dict = asdict(comp)
            
            # Preserve existing status and notes if component exists
            if comp.file_path in existing_map:
                existing_comp = existing_map[comp.file_path]
                comp_dict['status'] = existing_comp.get('status', ComponentStatus.NOT_STARTED.value)
                comp_dict['notes'] = existing_comp.get('notes', '')
            else:
                comp_dict['status'] = ComponentStatus.NOT_STARTED.value
                comp_dict['notes'] = ''
            
            updated_components.append(comp_dict)
        
        # Calculate statistics
        stats = self._calculate_statistics(updated_components)
        
        new_data = ChecklistData(
            generated_at=datetime.now().isoformat(),
            project_path=base_path,
            components=updated_components,
            statistics=stats,
            metadata={
                'total_components': len(updated_components),
                'scan_date': datetime.now().isoformat(),
            }
        )
        
        self.save(new_data)
        self.data = new_data
        return new_data
    
    def _calculate_statistics(self, components: List[Dict]) -> Dict[str, int]:
        """Calculate statistics from components"""
        stats = {
            'total': len(components),
            'by_type': {},
            'by_status': {},
            'with_tests': 0,
            'with_stories': 0,
            'not_started': 0,
            'in_progress': 0,
            'implemented': 0,
            'tested': 0,
            'documented': 0,
            'complete': 0,
        }
        
        for comp in components:
            # Count by type
            comp_type = comp.get('type', 'unknown')
            stats['by_type'][comp_type] = stats['by_type'].get(comp_type, 0) + 1
            
            # Count by status
            status = comp.get('status', ComponentStatus.NOT_STARTED.value)
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
            
            # Count status categories
            if status == ComponentStatus.NOT_STARTED.value:
                stats['not_started'] += 1
            elif status == ComponentStatus.IN_PROGRESS.value:
                stats['in_progress'] += 1
            elif status == ComponentStatus.IMPLEMENTED.value:
                stats['implemented'] += 1
            elif status == ComponentStatus.TESTED.value:
                stats['tested'] += 1
            elif status == ComponentStatus.DOCUMENTED.value:
                stats['documented'] += 1
            elif status == ComponentStatus.COMPLETE.value:
                stats['complete'] += 1
            
            # Count with tests/stories
            if comp.get('has_tests', False):
                stats['with_tests'] += 1
            if comp.get('has_stories', False):
                stats['with_stories'] += 1
        
        return stats

class ReportGenerator:
    """Generates reports from checklist data"""
    
    @staticmethod
    def generate_markdown_report(data: ChecklistData, output_file: str = "COMPONENT_CHECKLIST.md"):
        """Generate a markdown checklist report"""
        lines = [
            "# Component Checklist",
            "",
            f"**Generated:** {data.generated_at}",
            f"**Project Path:** {data.project_path}",
            "",
            "## Summary Statistics",
            "",
            f"- **Total Components:** {data.statistics.get('total', 0)}",
            f"- **With Tests:** {data.statistics.get('with_tests', 0)}",
            f"- **With Stories:** {data.statistics.get('with_stories', 0)}",
            "",
            "### Status Breakdown",
            "",
        ]
        
        status_counts = data.statistics.get('by_status', {})
        for status in ComponentStatus:
            count = status_counts.get(status.value, 0)
            lines.append(f"- **{status.value.replace('_', ' ').title()}:** {count}")
        
        lines.extend([
            "",
            "### By Type",
            "",
        ])
        
        type_counts = data.statistics.get('by_type', {})
        for comp_type, count in sorted(type_counts.items()):
            lines.append(f"- **{comp_type.title()}:** {count}")
        
        lines.extend([
            "",
            "---",
            "",
            "## Component Checklist",
            "",
            "| Status | Component | Type | File | Tests | Stories | Notes |",
            "|--------|-----------|------|------|-------|---------|-------|",
        ])
        
        # Sort components by type, then name
        sorted_components = sorted(
            data.components,
            key=lambda x: (x.get('type', ''), x.get('name', ''))
        )
        
        for comp in sorted_components:
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            status = comp.get('status', '').replace('_', ' ').title()
            name = comp.get('name', 'N/A')
            comp_type = comp.get('type', 'unknown')
            file_path = comp.get('file_path', 'N/A')
            tests = "✅" if comp.get('has_tests', False) else "❌"
            stories = "✅" if comp.get('has_stories', False) else "❌"
            notes = comp.get('notes', '').replace('|', '\\|')[:50]
            
            lines.append(
                f"| {status_icon} {status} | {name} | {comp_type} | `{file_path}` | {tests} | {stories} | {notes} |"
            )
        
        # Add detailed sections by type
        lines.extend([
            "",
            "---",
            "",
            "## Detailed Component List",
            "",
        ])
        
        current_type = None
        for comp in sorted_components:
            comp_type = comp.get('type', 'unknown')
            if comp_type != current_type:
                if current_type is not None:
                    lines.append("")
                lines.append(f"### {comp_type.title()}s")
                lines.append("")
                current_type = comp_type
            
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            name = comp.get('name', 'N/A')
            file_path = comp.get('file_path', 'N/A')
            status = comp.get('status', '').replace('_', ' ').title()
            
            lines.append(f"- {status_icon} **{name}** (`{file_path}`) - {status}")
            
            notes = comp.get('notes', '').strip()
            if notes:
                lines.append(f"  - *Notes: {notes}*")
        
        # Write to file
        output_path = Path(output_file)
        output_path.write_text('\n'.join(lines), encoding='utf-8')
        print(f"Markdown report generated: {output_path}")
    
    @staticmethod
    def _get_status_icon(status: str) -> str:
        """Get emoji icon for status"""
        icons = {
            ComponentStatus.NOT_STARTED.value: "⚪",
            ComponentStatus.IN_PROGRESS.value: "🟡",
            ComponentStatus.IMPLEMENTED.value: "🟢",
            ComponentStatus.TESTED.value: "🔵",
            ComponentStatus.DOCUMENTED.value: "📝",
            ComponentStatus.COMPLETE.value: "✅",
        }
        return icons.get(status, "⚪")
    
    @staticmethod
    def generate_text_report(data: ChecklistData):
        """Generate a text console report"""
        print("\n" + "="*80)
        print("COMPONENT CHECKLIST REPORT")
        print("="*80)
        print(f"\nGenerated: {data.generated_at}")
        print(f"Project: {data.project_path}\n")
        
        print("SUMMARY STATISTICS")
        print("-" * 80)
        stats = data.statistics
        print(f"Total Components: {stats.get('total', 0)}")
        print(f"With Tests: {stats.get('with_tests', 0)}")
        print(f"With Stories: {stats.get('with_stories', 0)}\n")
        
        print("STATUS BREAKDOWN")
        print("-" * 80)
        status_counts = stats.get('by_status', {})
        for status in ComponentStatus:
            count = status_counts.get(status.value, 0)
            icon = ReportGenerator._get_status_icon(status.value)
            print(f"  {icon} {status.value.replace('_', ' ').title()}: {count}")
        
        print("\nBY TYPE")
        print("-" * 80)
        type_counts = stats.get('by_type', {})
        for comp_type, count in sorted(type_counts.items()):
            print(f"  {comp_type.title()}: {count}")
        
        print("\n" + "="*80 + "\n")

class InteractiveManager:
    """Interactive checklist manager"""
    
    def __init__(self, manager: ChecklistManager):
        self.manager = manager
        self.data = manager.load()
    
    def run(self):
        """Run interactive checklist manager"""
        while True:
            self._show_menu()
            choice = input("\nSelect option (1-8, q to quit): ").strip().lower()
            
            if choice == 'q':
                break
            elif choice == '1':
                self._list_components()
            elif choice == '2':
                self._update_status()
            elif choice == '3':
                self._add_notes()
            elif choice == '4':
                self._filter_by_status()
            elif choice == '5':
                self._filter_by_type()
            elif choice == '6':
                self._show_statistics()
            elif choice == '7':
                self._export_checklist()
            elif choice == '8':
                self._search_components()
            else:
                print("Invalid option. Please try again.")
    
    def _show_menu(self):
        """Display main menu"""
        print("\n" + "="*60)
        print("COMPONENT CHECKLIST MANAGER")
        print("="*60)
        print("1. List all components")
        print("2. Update component status")
        print("3. Add/edit notes")
        print("4. Filter by status")
        print("5. Filter by type")
        print("6. Show statistics")
        print("7. Export checklist")
        print("8. Search components")
        print("Q. Quit")
    
    def _list_components(self):
        """List all components"""
        print("\n" + "-"*60)
        print("ALL COMPONENTS")
        print("-"*60)
        
        for idx, comp in enumerate(self.data.components, 1):
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            print(f"{idx:3}. {status_icon} {comp.get('name')} ({comp.get('type')}) - {comp.get('file_path')}")
    
    def _update_status(self):
        """Update component status"""
        self._list_components()
        try:
            idx = int(input("\nEnter component number: ")) - 1
            if 0 <= idx < len(self.data.components):
                comp = self.data.components[idx]
                print(f"\nCurrent status: {comp.get('status')}")
                print("\nAvailable statuses:")
                for status in ComponentStatus:
                    print(f"  - {status.value}")
                
                new_status = input("\nEnter new status: ").strip()
                if any(new_status == s.value for s in ComponentStatus):
                    comp['status'] = new_status
                    comp['last_updated'] = datetime.now().isoformat()
                    self.manager.save(self.data)
                    print(f"✓ Status updated to: {new_status}")
                else:
                    print("Invalid status")
            else:
                print("Invalid component number")
        except ValueError:
            print("Invalid input")
    
    def _add_notes(self):
        """Add or edit notes for a component"""
        self._list_components()
        try:
            idx = int(input("\nEnter component number: ")) - 1
            if 0 <= idx < len(self.data.components):
                comp = self.data.components[idx]
                current_notes = comp.get('notes', '')
                print(f"\nCurrent notes: {current_notes}")
                new_notes = input("\nEnter new notes (press Enter to keep current): ").strip()
                if new_notes:
                    comp['notes'] = new_notes
                    comp['last_updated'] = datetime.now().isoformat()
                    self.manager.save(self.data)
                    print("✓ Notes updated")
            else:
                print("Invalid component number")
        except ValueError:
            print("Invalid input")
    
    def _filter_by_status(self):
        """Filter components by status"""
        print("\nAvailable statuses:")
        for status in ComponentStatus:
            print(f"  - {status.value}")
        
        filter_status = input("\nEnter status to filter: ").strip()
        filtered = [
            comp for comp in self.data.components
            if comp.get('status') == filter_status
        ]
        
        print(f"\nFound {len(filtered)} components with status '{filter_status}':")
        for comp in filtered:
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            print(f"  {status_icon} {comp.get('name')} - {comp.get('file_path')}")
    
    def _filter_by_type(self):
        """Filter components by type"""
        types = set(comp.get('type') for comp in self.data.components)
        print("\nAvailable types:")
        for comp_type in sorted(types):
            print(f"  - {comp_type}")
        
        filter_type = input("\nEnter type to filter: ").strip()
        filtered = [
            comp for comp in self.data.components
            if comp.get('type') == filter_type
        ]
        
        print(f"\nFound {len(filtered)} components of type '{filter_type}':")
        for comp in filtered:
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            print(f"  {status_icon} {comp.get('name')} - {comp.get('file_path')}")
    
    def _show_statistics(self):
        """Show statistics"""
        ReportGenerator.generate_text_report(self.data)
    
    def _export_checklist(self):
        """Export checklist to markdown"""
        output_file = input("\nEnter output filename (default: COMPONENT_CHECKLIST.md): ").strip()
        if not output_file:
            output_file = "COMPONENT_CHECKLIST.md"
        ReportGenerator.generate_markdown_report(self.data, output_file)
    
    def _search_components(self):
        """Search components by name"""
        search_term = input("\nEnter search term: ").strip().lower()
        matches = [
            comp for comp in self.data.components
            if search_term in comp.get('name', '').lower() or
               search_term in comp.get('file_path', '').lower()
        ]
        
        print(f"\nFound {len(matches)} matching components:")
        for comp in matches:
            status_icon = ReportGenerator._get_status_icon(comp.get('status', ''))
            print(f"  {status_icon} {comp.get('name')} - {comp.get('file_path')}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Component Checklist Generator and Manager'
    )
    parser.add_argument(
        'command',
        choices=['scan', 'update', 'report', 'interactive'],
        help='Command to execute'
    )
    parser.add_argument(
        '--path',
        default='.',
        help='Base path to scan (default: current directory)'
    )
    parser.add_argument(
        '--checklist',
        default='component_checklist.json',
        help='Checklist file path (default: component_checklist.json)'
    )
    parser.add_argument(
        '--output',
        default='COMPONENT_CHECKLIST.md',
        help='Output file for reports (default: COMPONENT_CHECKLIST.md)'
    )
    
    args = parser.parse_args()
    
    base_path = Path(args.path).resolve()
    
    if args.command == 'scan':
        try:
            print(f"Scanning components in: {base_path}", flush=True)
            scanner = ComponentScanner(str(base_path))
            components = scanner.scan()
            print(f"Found {len(components)} components", flush=True)
            
            manager = ChecklistManager(args.checklist)
            data = manager.update_from_scan(components, str(base_path))
            print(f"\n✓ Checklist generated with {len(data.components)} components", flush=True)
            print(f"✓ Saved to: {args.checklist}", flush=True)
        except Exception as e:
            print(f"ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()
            sys.exit(1)
        
    elif args.command == 'update':
        print(f"Updating checklist from: {base_path}")
        scanner = ComponentScanner(str(base_path))
        components = scanner.scan()
        
        manager = ChecklistManager(args.checklist)
        data = manager.update_from_scan(components, str(base_path))
        print(f"Checklist updated with {len(data.components)} components")
        
    elif args.command == 'report':
        manager = ChecklistManager(args.checklist)
        data = manager.load()
        
        if not data.components:
            print("No checklist data found. Run 'scan' first.")
            return
        
        ReportGenerator.generate_text_report(data)
        ReportGenerator.generate_markdown_report(data, args.output)
        
    elif args.command == 'interactive':
        manager = ChecklistManager(args.checklist)
        interactive = InteractiveManager(manager)
        interactive.run()

if __name__ == '__main__':
    main()




