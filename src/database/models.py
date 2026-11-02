from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime
from datetime import datetime


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]      = mapped_column(primary_key=True)
    phone:         Mapped[str]      = mapped_column(String, unique=True, index=True, nullable=True)
    email:         Mapped[str]      = mapped_column(String, unique=True, index=True, nullable=True)
    password_hash: Mapped[str]      = mapped_column(String, nullable=False)
    is_verified:   Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)