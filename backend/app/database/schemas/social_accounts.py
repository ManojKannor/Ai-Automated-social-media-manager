from pydantic import BaseModel
from typing import Optional

class SocialAccountCreate(BaseModel):
    user_id: str
    gmail: str
    platform: str
    access_token: str
    platform_id: str
    username: Optional[str] = None
   