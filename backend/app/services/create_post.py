import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from app.database.database import get_session
from app.database.models.post_queue import PostQueue

load_dotenv()

router = APIRouter()

# --- CLOUDINARY CONFIGURATION (Setup once) ---
# Best practice: Use environment variables, but falling back to your keys for now
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "ds9qod3dw"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "246797847471888"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "_--dk4LnnWnraH3Va_6Rq2yJR54")
)

class UserReq(BaseModel):
    user_id: str

# ---------------------------------------------------------
# 1. GET PENDING POSTS (For specific User)
# ---------------------------------------------------------
@router.post("/get_pending_posts")
async def get_pending_posts(data: UserReq, session: Session = Depends(get_session)):
    # FIX: Logic corrected using parentheses ()
    # Rule: (Status is Pending OR Failed) AND (User ID matches)
    statement = select(PostQueue).where(
        (PostQueue.user_id == data.user_id) & 
        ((PostQueue.status == "pending") | (PostQueue.status == "failed"))
    )
    results = session.exec(statement).all()
    return results

# ---------------------------------------------------------
# 2. GET ALL POSTS (Ideally should filter by User ID)
# ---------------------------------------------------------
@router.get("/get_all_posts")
async def get_all_posts(session: Session = Depends(get_session)):
    # Note: In production, filter this by user_id too so users don't see others' posts
    statement = select(PostQueue)
    results = session.exec(statement).all()
    return results

# ---------------------------------------------------------
# 3. CREATE POST (Upload Media + Save to DB)
# ---------------------------------------------------------
@router.post("/create-post")
async def create_post(
    user_id: str = Form(...),
    platforms: str = Form(...),           # "facebook,instagram,linkedin"
    media_type: str = Form("image"),      # Default to image
    media: UploadFile = File(...),
    # FIX: Added type hints ': str' for Form parameters
    content_instagram: str = Form(""),
    content_facebook: str = Form(""),
    content_linkedin: str = Form(""),
    session: Session = Depends(get_session)
):
    print(f"Creating post for user: {user_id}")

    try:
        # A. Upload to Cloudinary
        # 'media.file' gives the file-like object required by Cloudinary
        upload_data = cloudinary.uploader.upload(
            media.file,
            resource_type="auto"  # Automatically detect image vs video
        )

        media_url = upload_data.get("secure_url")
        
        # B. Determine Media Type (Video or Image)
        # Cloudinary returns 'video' or 'image' in resource_type
        detected_type = upload_data.get("resource_type", "image")
        final_media_type = "video" if detected_type == "video" else "image"

        # C. Save to Database
        new_post = PostQueue(
            user_id=user_id,
            content_facebook=content_facebook,
            content_instagram=content_instagram,
            content_linkedin=content_linkedin,
            media_type=final_media_type,
            media_url=media_url,
            platforms=platforms,
            status="pending"  # IMPORTANT: Default status for approval workflow
        )

        session.add(new_post)
        session.commit()
        session.refresh(new_post)

        return {
            "message": "Post created successfully",
            "post_id": new_post.id,
            "media_url": media_url,
            "status": "pending"
        }

    except Exception as e:
        print(f"Error in create_post: {e}")
        raise HTTPException(status_code=500, detail=str(e))