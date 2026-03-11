"""Celery app configuration.

Run with:
    celery -A celery_worker worker --loglevel=info --queues=fast,slow
"""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "trinity",
    broker=settings.CELERY_BROKER_URL or settings.REDIS_URL,
    backend=settings.CELERY_RESULT_BACKEND or settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_default_queue="fast",
    task_queues={
        "fast": {"exchange": "fast", "routing_key": "fast"},
        "slow": {"exchange": "slow", "routing_key": "slow"},
    },
)

# Auto-discover tasks in app.tasks
celery_app.autodiscover_tasks(["app.tasks"])
