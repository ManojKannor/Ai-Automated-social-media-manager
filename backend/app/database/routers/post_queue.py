from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.database import get_session
from app.database.models.post_queue import PostQueue
from app.database.schemas.post_schema import PostQueueCreate

router = APIRouter(prefix="/postqueue", tags=["PostQueue"])

@router.post("/")
def create_post_queue(data: PostQueueCreate, session: Session = Depends(get_session)):
    post = PostQueue(**data.dict())
    session.add(post)
    session.commit()
    session.refresh(post)
    return {"message": "Post queued successfully", "post": post}

@router.get("/")
def get_all_posts(session: Session = Depends(get_session)):
    statement = select(PostQueue)
    return session.exec(statement).all()

@router.patch("/{post_id}/status")
def update_status(post_id: int, status: str, session: Session = Depends(get_session)):
    post = session.get(PostQueue, post_id)
    if not post:
        return {"error": "Post not found"}
    post.status = status
    session.add(post)
    session.commit()
    session.refresh(post)
    return {"message": "Status updated", "post": post}
