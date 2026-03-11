import json
import uuid

import redis
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.db.models import Memory

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
CACHE_TTL = 900  # 15 minutes


class MemoryService:
    def __init__(self, db: DBSession, user_id: str):
        self.db = db
        self.user_id = user_id

    def _cache_key(self, personality: str | None, key: str) -> str:
        p = personality or "shared"
        return f"memory:{self.user_id}:{p}:{key}"

    def get(self, key: str, personality: str | None = None) -> dict | None:
        cache_key = self._cache_key(personality, key)

        # Try Redis first
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except redis.ConnectionError:
            pass  # Redis down — fall through to DB

        # Fall back to DB
        query = self.db.query(Memory).filter(
            Memory.user_id == self.user_id,
            Memory.key == key,
        )
        if personality:
            query = query.filter(Memory.personality == personality)
        else:
            query = query.filter(Memory.scope == "shared")

        mem = query.first()
        if mem:
            try:
                redis_client.setex(cache_key, CACHE_TTL, json.dumps(mem.value))
            except redis.ConnectionError:
                pass
            return mem.value
        return None

    def set(self, key: str, value, personality: str | None = None):
        scope = "personal" if personality else "shared"
        cache_key = self._cache_key(personality, key)

        # Upsert in DB
        mem = self.db.query(Memory).filter(
            Memory.user_id == self.user_id,
            Memory.key == key,
            Memory.personality == personality,
        ).first()

        if mem:
            mem.value = value
        else:
            mem = Memory(
                id=str(uuid.uuid4()),
                user_id=self.user_id,
                personality=personality,
                scope=scope,
                key=key,
                value=value,
            )
            self.db.add(mem)

        self.db.commit()

        # Update cache
        try:
            redis_client.setex(cache_key, CACHE_TTL, json.dumps(value))
        except redis.ConnectionError:
            pass

    def list_all(self, personality: str | None = None) -> list[Memory]:
        query = self.db.query(Memory).filter(Memory.user_id == self.user_id)
        if personality:
            query = query.filter(Memory.personality == personality)
        return query.all()
