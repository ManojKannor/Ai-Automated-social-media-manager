from fastapi import APIRouter, HTTPException , Depends
from sqlmodel import SQLModel, Session, select
from app.database.database import get_session
from pydantic import BaseModel
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

# Import your existing database setup
from app.database.database import get_session, engine
from app.database.models.post_queue import PostQueue # Assuming this is your model name

# --- REQUEST MODELS ---
class ScheduleUpdate(BaseModel):
    post_id: int
    scheduled_at: str # expects ISO format string

class ApproveRequest(BaseModel):
    post_id: int
    scheduled_at: str

# --- BACKGROUND TASK: CHECKER ---
def check_and_post_scheduled_content():
    """
    Runs every minute.
    Checks for posts that are 'approved' and time has passed.
    """
    with Session(engine) as session:
        try:
            now = datetime.now()
            # Select posts that are approved AND scheduled time is in the past
            statement = select(PostQueue).where(
                (PostQueue.status == "approved") & 
                (PostQueue.scheduled_at <= now)
            )
            +3
            posts_due = session.exec(statement).all()

            if posts_due:
                print(f"⏰ Scheduler found {len(posts_due)} posts to publish...")

            for post in posts_due:
                print(f"🚀 Publishing Post #{post.id} to {post.platforms}...")
                
                # --- CALL YOUR POSTING FUNCTION HERE ---
                from app.services.autoPosting import post_social
                post_social(post) 
                
                # Update status so it doesn't post again
                post.status = "published" # or 'completed'
                session.add(post)
            
            session.commit()
        except Exception as e:
            print(f"Scheduler Error: {e}")

# --- LIFESPAN MANAGER (Starts Scheduler) ---
@asynccontextmanager
async def lifespan(router: APIRouter):
    # Startup
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_post_scheduled_content, 'interval', seconds=60)
    scheduler.start()
    print("✅ Background Scheduler Started")
    yield
    # Shutdown
    scheduler.shutdown()

# --- FASTAPI APP ---
# Make sure to add lifespan=lifespan here
router = APIRouter(lifespan=lifespan)

# ... (Include your existing middlewares and routers here) ...

# --- NEW ENDPOINTS FOR ADMIN DASHBOARD ---

@router.post("/update_schedule")
async def update_schedule(data: ScheduleUpdate , session : Session = Depends(get_session)):

    post = session.exec(select(PostQueue).where(PostQueue.id == data.post_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
        # Convert string to datetime object
    try:
        new_time = datetime.fromisoformat(data.scheduled_at.replace('Z', ''))
        post.scheduled_at = new_time
        session.add(post)
        session.commit()
        return {"msg": "Schedule updated", "new_time": new_time}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.post("/admin/approved")
async def approve_post(data: ApproveRequest, session : Session = Depends(get_session)):
    
    post = session.exec(select(PostQueue).where(PostQueue.id == data.post_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
        # Update Status and Time
    try:
        final_time = datetime.fromisoformat(data.scheduled_at.replace('Z', ''))
        post.scheduled_at = final_time
        post.status = "approved" # This triggers the scheduler to pick it up later
            
        session.add(post)
        session.commit()
        return {"msg": "Post approved and scheduled"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")