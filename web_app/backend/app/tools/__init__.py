"""Tool stub implementations.

All tools return {"status": "not_implemented"} for now.
Real implementations will be added in future sprints.
"""


async def web_search(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "web_search", "query": params.get("query")}


async def browser_automation(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "browser_automation"}


async def smart_home(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "smart_home"}


async def calendar(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "calendar"}


async def brainstorm(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "brainstorm"}


async def cad_generation(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "cad_generation"}


async def image_generation(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "image_generation"}


async def writing_assist(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "writing_assist"}


async def printer_control(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "3d_printer_control"}


async def code_generation(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "code_generation"}


async def terminal(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "terminal"}


async def git_control(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "git_control"}


async def file_operations(params: dict) -> dict:
    return {"status": "not_implemented", "tool": "file_operations"}


# Registry: tool_name -> handler function
TOOL_REGISTRY = {
    "web_search": web_search,
    "browser_automation": browser_automation,
    "smart_home": smart_home,
    "calendar": calendar,
    "brainstorm": brainstorm,
    "cad_generation": cad_generation,
    "image_generation": image_generation,
    "writing_assist": writing_assist,
    "3d_printer_control": printer_control,
    "code_generation": code_generation,
    "terminal": terminal,
    "git_control": git_control,
    "file_operations": file_operations,
}
