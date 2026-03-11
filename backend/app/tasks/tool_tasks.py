"""Celery tasks for async tool execution.

These tasks run in a separate worker process, allowing long-running tools
(browser automation, CAD generation, etc.) to execute without blocking
the FastAPI event loop.
"""

from celery import shared_task


@shared_task(bind=True, queue="fast", max_retries=2)
def execute_tool_fast(self, task_id: str, tool_name: str, params: dict, personality_slug: str):
    """Fast tool execution (web search, code gen) — expected < 5s."""
    from app.core.personality_manager import PersonalityManager
    from app.core.tool_router import ToolRouter

    import asyncio
    import time

    personality = PersonalityManager.load(personality_slug)
    tool_router = ToolRouter(personality)

    start = time.time()
    try:
        result = asyncio.run(tool_router.execute(tool_name, params))
        duration_ms = int((time.time() - start) * 1000)
        return {
            "task_id": task_id,
            "status": "done",
            "result": result,
            "duration_ms": duration_ms,
        }
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        return {
            "task_id": task_id,
            "status": "failed",
            "error": str(e),
            "duration_ms": duration_ms,
        }


@shared_task(bind=True, queue="slow", max_retries=1, time_limit=120)
def execute_tool_slow(self, task_id: str, tool_name: str, params: dict, personality_slug: str):
    """Slow tool execution (CAD generation, browser automation) — may take up to 2 min."""
    from app.core.personality_manager import PersonalityManager
    from app.core.tool_router import ToolRouter

    import asyncio
    import time

    personality = PersonalityManager.load(personality_slug)
    tool_router = ToolRouter(personality)

    start = time.time()
    try:
        result = asyncio.run(tool_router.execute(tool_name, params))
        duration_ms = int((time.time() - start) * 1000)
        return {
            "task_id": task_id,
            "status": "done",
            "result": result,
            "duration_ms": duration_ms,
        }
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        return {
            "task_id": task_id,
            "status": "failed",
            "error": str(e),
            "duration_ms": duration_ms,
        }


# Classify tools by expected speed
FAST_TOOLS = {"web_search", "code_generation", "brainstorm", "writing_assist"}
SLOW_TOOLS = {"browser_automation", "cad_generation", "3d_printer_control", "image_generation"}


def dispatch_tool_task(task_id: str, tool_name: str, params: dict, personality_slug: str):
    """Route to fast or slow queue based on tool type."""
    if tool_name in SLOW_TOOLS:
        return execute_tool_slow.delay(task_id, tool_name, params, personality_slug)
    return execute_tool_fast.delay(task_id, tool_name, params, personality_slug)
