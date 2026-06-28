from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.database.database import get_session, engine
from pydantic import BaseModel
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import threading

from app.database.models.post_queue import PostQueue


# --- REQUEST MODELS ---
class ScheduleUpdate(BaseModel):
    post_id: int
    scheduled_at: str


class ApproveRequest(BaseModel):
    post_id: int
    scheduled_at: str


# --- BACKGROUND TASK ---
def check_and_post_scheduled_content():
    with Session(engine) as session:
        try:
            now = datetime.now()

            statement = select(PostQueue).where(
                (PostQueue.status == "approved") &
                (PostQueue.scheduled_at <= now)
            )

            posts_due = session.exec(statement).all()

            if posts_due:
                print(f"⏰ Found {len(posts_due)} posts")

            for post in posts_due:
                print(f"🚀 Publishing Post #{post.id}")

                # 🔥 IMPORTANT: mark as processing FIRST
                post.status = "processing"
                session.add(post)

                # 🔥 THREADING (NO BLOCKING)
                from app.services.autoPosting import post_social
                threading.Thread(target=post_social, args=(post,)).start()

            session.commit()

        except Exception as e:
            print(f"❌ Scheduler Error: {e}")


# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(router: APIRouter):
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        check_and_post_scheduled_content,
        "interval",
        seconds=60,
        max_instances=1   # 🔥 prevent overlap
    )

    scheduler.start()
    print("✅ Scheduler Started")

    yield

    scheduler.shutdown()
    print("🛑 Scheduler Stopped")


# --- ROUTER ---
router = APIRouter(lifespan=lifespan)


# --- UPDATE SCHEDULE ---
@router.post("/update_schedule")
async def update_schedule(data: ScheduleUpdate, session: Session = Depends(get_session)):

    post = session.exec(select(PostQueue).where(PostQueue.id == data.post_id)).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        new_time = datetime.fromisoformat(data.scheduled_at.replace('Z', ''))

        post.scheduled_at = new_time
        session.add(post)
        session.commit()

        return {"msg": "Schedule updated", "new_time": new_time}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")


# --- APPROVE POST ---
@router.post("/admin/approved")
async def approve_post(data: ApproveRequest, session: Session = Depends(get_session)):

    post = session.exec(select(PostQueue).where(PostQueue.id == data.post_id)).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        final_time = datetime.fromisoformat(data.scheduled_at.replace('Z', ''))

        post.scheduled_at = final_time
        post.status = "approved"

        session.add(post)
        session.commit()

        return {"msg": "Post approved and scheduled"}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")