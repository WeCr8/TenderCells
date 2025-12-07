"""Express API directory structure builders."""

from typing import List


class ExpressApiStructures:
    """Builders for Express API directory structures."""
    
    @staticmethod
    def express_api(base: str = "backend/src") -> List[str]:
        """Generate Express API structure with modules (preserves original)."""
        return [
            base,
            f"{base}/config",
            f"{base}/routes",
            f"{base}/controllers",
            f"{base}/services",
            f"{base}/models",
            f"{base}/middleware",
            f"{base}/utils",
            f"{base}/types",
            f"{base}/modules",
            f"{base}/modules/coops",
            f"{base}/modules/birds",
            f"{base}/modules/automation",
            f"{base}/modules/connectivity",
            f"{base}/modules/connectivity/ble",
            f"{base}/modules/connectivity/wifi",
            f"{base}/modules/connectivity/mqtt",
            f"{base}/modules/connectivity/websocket",
            f"{base}/modules/hardware",
            f"{base}/modules/hardware/sensors",
            f"{base}/modules/hardware/actuators",
            f"{base}/modules/integrations",
            f"{base}/modules/integrations/weather",
            f"{base}/modules/integrations/notifications",
        ]

