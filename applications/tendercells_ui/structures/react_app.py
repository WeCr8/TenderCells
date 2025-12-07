"""React app directory structure builders."""

from typing import List


class ReactAppStructures:
    """Builders for React app directory structures."""
    
    @staticmethod
    def base_react_app(base: str = "src") -> List[str]:
        """Generate a base React app structure."""
        return [
            base,
            f"{base}/components",
            f"{base}/components/layout",
            f"{base}/components/navigation",
            f"{base}/components/common",
            f"{base}/hooks",
            f"{base}/context",
            f"{base}/pages",
            f"{base}/routes",
            f"{base}/types",
            f"{base}/styles",
            f"{base}/services",
            f"{base}/assets",
            f"{base}/public",
            f"{base}/tests",
            f"{base}/tests/e2e",
            f"{base}/utils",
        ]
    
    @staticmethod
    def full_react_app(base: str = "src") -> List[str]:
        """Generate a full React app structure with all feature directories (preserves original)."""
        return [
            base,
            f"{base}/components",
            f"{base}/components/layout",
            f"{base}/components/navigation",
            f"{base}/components/viewport",
            f"{base}/components/telemetry",
            f"{base}/components/toolbar",
            f"{base}/components/menu-sections",
            f"{base}/components/chicken-eye",
            f"{base}/components/chicken-eye/cameras",
            f"{base}/components/chicken-eye/birds",
            f"{base}/components/chicken-eye/insights",
            f"{base}/components/chicken-eye/bird-management",
            f"{base}/components/cnc",
            f"{base}/components/analytics",
            f"{base}/components/maintenance",
            f"{base}/components/overlays",
            f"{base}/components/safety",
            f"{base}/components/notifications",
            f"{base}/components/help",
            f"{base}/components/common",
            f"{base}/hooks",
            f"{base}/hooks/chicken-eye",
            f"{base}/context",
            f"{base}/icons",
            f"{base}/lib",
            f"{base}/lib/firebase",
            f"{base}/automation",
            f"{base}/automation/devices",
            f"{base}/automation/rules",
            f"{base}/automation/schedules",
            f"{base}/automation/safety",
            f"{base}/automation/automationContext",
            f"{base}/automation/birds",
            f"{base}/pages",
            f"{base}/routes",
            f"{base}/types",
            f"{base}/styles",
            f"{base}/models",
            f"{base}/models/presets",
            f"{base}/models/loaders",
            f"{base}/services",
            f"{base}/services/connectivity",
            f"{base}/services/hardware",
            f"{base}/assets",
            f"{base}/public",
            f"{base}/tests",
            f"{base}/tests/e2e",
        ]
    
    @staticmethod
    def product_specific(product: str, base: str = "src") -> List[str]:
        """Generate product-specific directory structures."""
        base_dirs = ReactAppStructures.base_react_app(base)
        
        # Product-specific feature directories
        product_features = {
            "chicken-tender": [
                f"{base}/components/chicken-eye",
                f"{base}/components/chicken-eye/cameras",
                f"{base}/components/chicken-eye/birds",
                f"{base}/components/chicken-eye/insights",
                f"{base}/components/chicken-eye/bird-management",
                f"{base}/hooks/chicken-eye",
                f"{base}/components/cnc",
                f"{base}/components/flock",
                f"{base}/components/automation",
            ],
            "duck-dock": [
                f"{base}/components/pond-monitoring",
                f"{base}/components/water-quality",
                f"{base}/components/flock",
            ],
            "goat-guardian": [
                f"{base}/components/pasture-management",
                f"{base}/components/milk-tracking",
                f"{base}/components/herd",
            ],
            "pig-pal": [
                f"{base}/components/pen-management",
                f"{base}/components/weight-tracking",
                f"{base}/components/pigs",
            ],
            "cattle-care": [
                f"{base}/components/herd-management",
                f"{base}/components/grazing",
                f"{base}/components/cattle",
            ],
        }
        
        return base_dirs + product_features.get(product, [])

