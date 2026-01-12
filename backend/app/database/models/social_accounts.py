from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class SocialAccounts(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: str  # Auth0 user ID (sub claim)
    gmail : str
    platform: str  # facebook / instagram / linkedin
    access_token: Optional[str] = Field(default=None, nullable=True)


    platform_id : str 
    username: Optional[str] = None

    status: str = Field(default="valid")  # valid / invalid
    last_checked: datetime = Field(default_factory=datetime.utcnow)

    created_at: datetime = Field(default_factory=datetime.utcnow)
