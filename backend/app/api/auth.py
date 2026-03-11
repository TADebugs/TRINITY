import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.db.models import User
from app.db.schemas import RegisterRequest, UserProfile

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency — extract and validate JWT, return User row."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def verify_token(token: str) -> str | None:
    """Verify a JWT and return the user_id, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        display_name=body.display_name,
        hashed_password=pwd_context.hash(body.password),
    )
    db.add(user)
    db.commit()

    return {
        "token": create_token(user.id),
        "user": {"id": user.id, "name": user.display_name},
    }


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return {"access_token": create_token(user.id), "token_type": "bearer"}


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)):
    return current_user
