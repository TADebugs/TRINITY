import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.personality_manager import PersonalityManager
from app.core.tool_router import ToolPermissionError, ToolRouter
from app.db.database import get_db
from app.db.models import ToolExecution, User
from app.db.schemas import ToolAvailableResponse, ToolRequest, ToolStatus

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/execute", response_model=ToolStatus)
@limiter.limit("10/minute")
async def execute_tool(
    request: Request,
    body: ToolRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    personality = PersonalityManager.load(body.personality)
    tool_router = ToolRouter(personality)

    task_id = str(uuid.uuid4())

    # Record execution
    execution = ToolExecution(
        id=task_id,
        user_id=current_user.id,
        personality=body.personality,
        tool_name=body.tool_name,
        input_data=body.params,
        status="pending",
    )
    db.add(execution)
    db.commit()

    # Execute tool (synchronously for now — Celery integration comes later)
    start = time.time()
    try:
        result = await tool_router.execute(body.tool_name, body.params)
        duration_ms = int((time.time() - start) * 1000)

        execution.status = "done"
        execution.output_data = result
        execution.duration_ms = duration_ms
        db.commit()

        return ToolStatus(
            task_id=task_id,
            status="done",
            result=result,
            duration_ms=duration_ms,
        )
    except ToolPermissionError as e:
        execution.status = "failed"
        execution.output_data = {"error": str(e)}
        db.commit()
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        execution.status = "failed"
        execution.output_data = {"error": str(e)}
        execution.duration_ms = duration_ms
        db.commit()

        return ToolStatus(
            task_id=task_id,
            status="failed",
            error=str(e),
            duration_ms=duration_ms,
        )


@router.get("/status/{task_id}", response_model=ToolStatus)
def get_tool_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    execution = (
        db.query(ToolExecution)
        .filter(ToolExecution.id == task_id, ToolExecution.user_id == current_user.id)
        .first()
    )
    if not execution:
        raise HTTPException(status_code=404, detail="Task not found")

    return ToolStatus(
        task_id=execution.id,
        status=execution.status,
        result=execution.output_data if execution.status == "done" else None,
        error=execution.output_data.get("error") if execution.status == "failed" and execution.output_data else None,
        duration_ms=execution.duration_ms,
    )


@router.get("/available/{personality}", response_model=ToolAvailableResponse)
def get_available_tools(
    personality: str,
    current_user: User = Depends(get_current_user),
):
    config = PersonalityManager.load(personality)
    return ToolAvailableResponse(
        enabled=config.tools_enabled,
        disabled=config.tools_disabled,
    )
