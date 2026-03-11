from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.memory_service import MemoryService
from app.db.database import get_db
from app.db.models import User
from app.db.schemas import MemoryEntry, MemoryListResponse, MemoryUpdateRequest

router = APIRouter()


def _get_memory_service(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemoryService:
    return MemoryService(db=db, user_id=current_user.id)


@router.get("", response_model=MemoryListResponse)
def list_memories(
    personality: str | None = None,
    svc: MemoryService = Depends(_get_memory_service),
):
    rows = svc.list_all(personality=personality)
    return {
        "memories": [
            MemoryEntry(
                key=m.key,
                value=m.value,
                scope=m.scope,
                personality=m.personality.value if m.personality else None,
                updated_at=m.updated_at,
            )
            for m in rows
        ]
    }


@router.get("/{key}")
def get_memory(
    key: str,
    personality: str | None = None,
    svc: MemoryService = Depends(_get_memory_service),
):
    value = svc.get(key=key, personality=personality)
    if value is None:
        raise HTTPException(status_code=404, detail="Memory key not found")
    return {"key": key, "value": value, "scope": "personal" if personality else "shared"}


@router.put("/{key}")
def update_memory(
    key: str,
    body: MemoryUpdateRequest,
    svc: MemoryService = Depends(_get_memory_service),
):
    svc.set(key=key, value=body.value, personality=body.personality)
    return {"success": True}
