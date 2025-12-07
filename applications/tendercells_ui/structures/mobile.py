"""Mobile app directory structure builders (placeholder for future)."""

from typing import List


class MobileStructures:
    """Builders for mobile app directory structures."""
    
    @staticmethod
    def android_app(base: str = "android/app/src/main") -> List[str]:
        """Generate Android app structure."""
        return [
            base,
            f"{base}/java",
            f"{base}/java/com/tendercells",
            f"{base}/res",
            f"{base}/res/layout",
            f"{base}/res/values",
            f"{base}/res/drawable",
        ]
    
    @staticmethod
    def ios_app(base: str = "ios") -> List[str]:
        """Generate iOS app structure."""
        return [
            base,
            f"{base}/Sources",
            f"{base}/Resources",
            f"{base}/Tests",
        ]

