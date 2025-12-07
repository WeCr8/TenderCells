"""Base template generator class."""


class BaseTemplateGenerator:
    """Base class for template generators."""
    
    @staticmethod
    def indent(text: str, spaces: int = 2) -> str:
        """Indent text by specified number of spaces."""
        return "\n".join(" " * spaces + line if line else line for line in text.split("\n"))
    
    @staticmethod
    def format_template(template: str, **kwargs) -> str:
        """Format a template string with keyword arguments."""
        return template.format(**kwargs)

