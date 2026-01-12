from sqlmodel import SQLModel, Field, Column, TEXT
from datetime import datetime

class PostQueue(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False)

    content_facebook: str | None = Field(sa_column=Column(TEXT))
    content_instagram: str | None = Field(sa_column=Column(TEXT))
    content_linkedin: str | None = Field(sa_column=Column(TEXT))

    media_type: str | None = Field(default=None)
    media_url: str | None = Field(sa_column=Column(TEXT))

    platforms: str = Field(sa_column=Column(TEXT, nullable=False))
    scheduled_at: datetime = Field(nullable=True)
    status: str = Field(default="pending")
