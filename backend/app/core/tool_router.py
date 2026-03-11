from app.core.personality_manager import PersonalityConfig


class ToolPermissionError(Exception):
    pass


class ToolRouter:
    def __init__(self, personality: PersonalityConfig):
        self.personality = personality

    def check_permission(self, tool_name: str):
        if tool_name in self.personality.tools_disabled:
            raise ToolPermissionError(
                f"{self.personality.name} does not have access to '{tool_name}'. "
                f"Switch to the appropriate personality to use this tool."
            )
        if tool_name not in self.personality.tools_enabled:
            raise ToolPermissionError(f"Tool '{tool_name}' is not registered.")

    async def execute(self, tool_name: str, params: dict) -> dict:
        self.check_permission(tool_name)

        # Import and run the stub tool implementations
        from app.tools import TOOL_REGISTRY

        handler = TOOL_REGISTRY.get(tool_name)
        if handler is None:
            return {"status": "not_implemented", "tool": tool_name}

        return await handler(params)
