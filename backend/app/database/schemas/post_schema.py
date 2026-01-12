# app/database/schemas/post_schema.py

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class PostCreate(BaseModel):
    user_id: str
    content_Keys: str
    platforms: List[str]
    scheduled_at: datetime
    
    # -----------------------------------------------------
    # Future field for file upload (when using form-data)
    # file: UploadFile | None = None
    # In JSON mode, UploadFile cannot exist, so it stays commented.
    # -----------------------------------------------------
