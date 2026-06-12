# Component Checklist - Quick Start

## Run the Checklist Scanner

The component checklist system is ready to use. **First, navigate to the correct directory:**

```powershell
# Navigate to the directory containing the scripts
cd applications\tendercells_ui\applications\tendercells_ui\test_output\tendercells-ui
```

Then run:

```bash
# Scan for components (creates component_checklist.json)
python component_checklist.py scan

# Generate markdown report
python component_checklist.py report

# Interactive management
python component_checklist.py interactive

# Update checklist after adding new components
python component_checklist.py update
```

## Or use the PowerShell wrapper:

```powershell
# Windows PowerShell (from the tendercells-ui directory)
.\run-checklist.ps1 scan
.\run-checklist.ps1 report
.\run-checklist.ps1 interactive
```

## Quick Command (from project root):

If you're in the project root, you can run:

```powershell
# From project root
cd applications\tendercells_ui\applications\tendercells_ui\test_output\tendercells-ui; python component_checklist.py scan
```

## What It Does

1. **Scans** `src/` directory for:
   - React components (`*.tsx`, `*.jsx`)
   - Pages (`pages/` directory)
   - Hooks (`hooks/` directory)  
   - Services (`services/` directory)
   - Utilities (`utils/` directory)

2. **Creates** `component_checklist.json` with:
   - Component names and file paths
   - Component types
   - Test file detection
   - Line counts
   - Import/export information

3. **Generates** `COMPONENT_CHECKLIST.md` report with:
   - Status breakdown
   - Statistics
   - Markdown table checklist

## Status Workflow

1. ⚪ **not_started** - Component discovered but not worked on
2. 🟡 **in_progress** - Currently being developed
3. 🟢 **implemented** - Code complete
4. 🔵 **tested** - Has tests
5. 📝 **documented** - Has documentation
6. ✅ **complete** - Fully done (implemented + tested + documented)

## Files Generated

- `component_checklist.json` - Machine-readable checklist data
- `COMPONENT_CHECKLIST.md` - Human-readable markdown report

Both files are safe to commit to version control for team tracking!
