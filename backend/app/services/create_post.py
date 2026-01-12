from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlmodel import Session , select
from datetime import datetime

from app.database.database import get_session
from app.database.models.post_queue import PostQueue
from app.services.caption_generation import generateCaption
import cloudinary
import cloudinary.uploader
from cloudinary.uploader import upload
from app.Auth.auth_utils import verify_admin_role
router = APIRouter()

@router.get("/get_pending_posts")
async def get_pending_posts(session : Session = Depends(get_session)):
    statement = select(PostQueue).where((PostQueue.status == "pending") | (PostQueue.status == "failed"))
    results = session.exec(statement).all()
    
    return results

@router.get("/get_all_posts")
async def get_all_posts(session : Session = Depends(get_session)):
    statement = select(PostQueue)
    results = session.exec(statement).all()

    return results


@router.post("/create-post")
async def create_post(
    user_id: str = Form(...),
    platforms: str = Form(...),              # "facebook,instagram,linkedin"
    media_type : str = Form(...),
    media: UploadFile = File(...),
    content_instagram = Form(...),
    content_facebook = Form(...),
    content_linkedin = Form(...),
    session: Session = Depends(get_session)
):
    print("==============================================",content_facebook,"==================================================")
    cloudinary.config(
        cloud_name="ds9qod3dw",
        api_key="246797847471888",
        api_secret="_--dk4LnnWnraH3Va_6Rq2yJR54"
    )
    # 2️⃣ Upload to Cloudinary
    upload_data = upload(
        media.file,
        resource_type="auto"
    )

    media_url = upload_data["secure_url"]
    media_type = "video" if upload_data["resource_type"] == "video" else "photo"

    # 3️⃣ Save to DB
    new_post = PostQueue(
        user_id=user_id,
        content_facebook=content_facebook,
        content_instagram=content_instagram,
        content_linkedin=content_linkedin,
        media_type=media_type,
        media_url=media_url,
        platforms=platforms,
    )

    session.add(new_post)
    session.commit()
    session.refresh(new_post)

    return {
        "message": "Post created successfully",
        "post_id": new_post.id,
        "media_url": media_url
    }
