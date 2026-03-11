from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TRINITY"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql://localhost:5432/trinity"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI
    GEMINI_API_KEY: str = ""

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "https://trinity.vercel.app",
    ]

    # Celery
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
