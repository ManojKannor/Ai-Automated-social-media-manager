from fastapi import FastAPI , APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import create_db_and_tables
from app.face_insta_accessToken import router as face_insta_router
from app.linkedin_AccessToken import router as linkedin_router
from app.services.create_post import router as create_post_router
# from app.services.autoPosting import router as posting
from app.services.caption_generation import router as generateCaption
from app.services.create_post import router as create_post_router
from app.services.dashboard import router as dashboard
from app.services.connect_accounts import router as connectAccounts
from app.services.scheduledPost import router as schedulePostsRouter
app = FastAPI()
admin_router = APIRouter()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000","http://localhost:5173"],  # React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(connectAccounts)
app.include_router(create_post_router)
app.include_router(schedulePostsRouter)
app.include_router(dashboard)
app.include_router(generateCaption)
app.include_router(face_insta_router)
app.include_router(linkedin_router)

# app.include_router(posting)
@app.get("/")
def startup():
    create_db_and_tables()
    return "Welcome to Ai social media manager platform by Manoj Kannor"


