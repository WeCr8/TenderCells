"""
Main CLI entry point for TenderCells scaffolding generator.
"""

import os
import sys
import argparse

# Add the project root to the path so we can import the package
_script_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(os.path.dirname(_script_dir))  # Go up to TenderCells root
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from applications.tendercells_ui.builders.registry import (
    PROJECT_BUILDERS,
    get_builder,
    list_projects,
    SUPPORTED_PRODUCTS,
    is_product_supported,
)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="TenderCells project scaffolding generator"
    )
    parser.add_argument(
        "--project",
        "-p",
        type=str,
        default="tendercells-ui",
        help="Which project scaffold to generate",
        choices=list_projects(),
    )
    parser.add_argument(
        "--product",
        type=str,
        default=None,
        help="Product name for react-web-app (chicken-tender, duck-dock, etc.)",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress detailed output",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default=None,
        help="Output directory for generated files (default: script's directory)",
    )

    args = parser.parse_args()

    # Determine output directory: use provided path, or script's directory if not specified
    if args.output_dir:
        base_path = args.output_dir
    else:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_path = os.path.dirname(script_dir)  # Go up one level from cli.py

    builder = get_builder(args.project)
    if not builder:
        print("Unknown project. Available options:")
        for key in list_projects():
            print(f" - {key}")
        sys.exit(1)

    # Handle product-specific builds
    if args.project == "react-web-app":
        if not args.product:
            print("Error: --product is required for react-web-app")
            print(f"Supported products: {', '.join(SUPPORTED_PRODUCTS)}")
            sys.exit(1)
        if not is_product_supported(args.product):
            print(f"Error: Unsupported product '{args.product}'")
            print(f"Supported products: {', '.join(SUPPORTED_PRODUCTS)}")
            sys.exit(1)
        generator = builder(product=args.product, base_path=base_path)
    elif args.project == "tendercells-ui":
        generator = builder(base_path=base_path)
    else:
        generator = builder(base_path=base_path)

    generator.generate(verbose=not args.quiet)


if __name__ == "__main__":
    main()

